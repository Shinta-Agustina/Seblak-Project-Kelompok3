


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."arsipkan_transaksi_dihapus"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_data jsonb;
BEGIN
  INSERT INTO public.mutasi_stok (stok_id, tipe, jumlah, keterangan, dibuat_oleh)
  SELECT m.stok_id, 'masuk',
         SUM(CASE m.tipe WHEN 'keluar' THEN m.jumlah ELSE -m.jumlah END),
         'Hapus transaksi ' || OLD.nomor_transaksi,
         auth.uid()
  FROM public.mutasi_stok m
  WHERE m.transaksi_id = OLD.id
  GROUP BY m.stok_id
  HAVING SUM(CASE m.tipe WHEN 'keluar' THEN m.jumlah ELSE -m.jumlah END) > 0
  ORDER BY m.stok_id;

  v_data := to_jsonb(OLD) || jsonb_build_object(
    'detail',
    COALESCE((SELECT jsonb_agg(to_jsonb(d))
              FROM public.detail_transaksi d
              WHERE d.transaksi_id = OLD.id), '[]'::jsonb)
  );

  INSERT INTO public.log_transaksi_dihapus
    (transaksi_id, nomor_transaksi, data, alasan, dihapus_oleh)
  VALUES (OLD.id, OLD.nomor_transaksi, v_data,
          NULLIF(current_setting('app.alasan_hapus', true), ''),
          auth.uid());

  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."arsipkan_transaksi_dihapus"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."batasi_edit_transaksi"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_owner() THEN
    IF OLD.status IN ('Dibatalkan', 'Refund')
       OR OLD.status_pesanan IN ('Selesai', 'Dibatalkan') THEN
      RAISE EXCEPTION 'Transaksi yang sudah final hanya dapat diubah oleh owner'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."batasi_edit_transaksi"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."buat_pengeluaran_dengan_permintaan"("p_nama_pengeluaran" "text", "p_stok_id" "uuid", "p_jumlah" numeric, "p_harga_satuan" numeric, "p_kategori" "text" DEFAULT 'Lainnya'::"text", "p_tanggal" "date" DEFAULT CURRENT_DATE, "p_catatan" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user_id uuid;
    v_pengeluaran public.pengeluaran%ROWTYPE;
    v_permintaan public.permintaan_stok%ROWTYPE;
    v_stok public.stok_bahan%ROWTYPE;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Silakan login terlebih dahulu.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = v_user_id
          AND status = 'aktif'
    ) THEN
        RAISE EXCEPTION 'Profil pengguna tidak aktif atau tidak ditemukan.';
    END IF;

    IF COALESCE(trim(p_nama_pengeluaran), '') = '' THEN
        RAISE EXCEPTION 'Nama pengeluaran wajib diisi.';
    END IF;

    IF p_jumlah IS NULL OR p_jumlah <= 0 THEN
        RAISE EXCEPTION 'Jumlah harus lebih dari 0.';
    END IF;

    IF p_harga_satuan IS NULL OR p_harga_satuan < 0 THEN
        RAISE EXCEPTION 'Harga satuan tidak boleh negatif.';
    END IF;

    SELECT *
    INTO v_stok
    FROM public.stok_bahan
    WHERE id = p_stok_id
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bahan baku tidak ditemukan.';
    END IF;

    INSERT INTO public.pengeluaran (
        nama_pengeluaran,
        kategori,
        jumlah,
        harga_satuan,
        total,
        tanggal,
        catatan,
        dibuat_oleh,
        stok_id
    )
    VALUES (
        trim(p_nama_pengeluaran),
        COALESCE(NULLIF(trim(p_kategori), ''), 'Lainnya'),
        p_jumlah,
        p_harga_satuan,
        p_jumlah * p_harga_satuan,
        COALESCE(p_tanggal, CURRENT_DATE),
        p_catatan,
        v_user_id,
        p_stok_id
    )
    RETURNING * INTO v_pengeluaran;

    INSERT INTO public.permintaan_stok (
        pengeluaran_id,
        stok_id,
        jumlah,
        status,
        diajukan_oleh
    )
    VALUES (
        v_pengeluaran.id,
        p_stok_id,
        p_jumlah,
        'menunggu',
        v_user_id
    )
    RETURNING * INTO v_permintaan;

    RETURN jsonb_build_object(
        'pengeluaran', to_jsonb(v_pengeluaran),
        'permintaan', to_jsonb(v_permintaan)
    );
END;
$$;


ALTER FUNCTION "public"."buat_pengeluaran_dengan_permintaan"("p_nama_pengeluaran" "text", "p_stok_id" "uuid", "p_jumlah" numeric, "p_harga_satuan" numeric, "p_kategori" "text", "p_tanggal" "date", "p_catatan" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."buat_transaksi"("p_items" "jsonb", "p_tipe_pesanan" "text" DEFAULT 'Dine In'::"text", "p_kuah" "text" DEFAULT NULL::"text", "p_level_pedas" integer DEFAULT NULL::integer, "p_catatan" "text" DEFAULT NULL::"text", "p_diskon" numeric DEFAULT 0, "p_metode_pembayaran" "text" DEFAULT 'Tunai'::"text", "p_uang_diterima" numeric DEFAULT 0) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_kasir    public.kasir%ROWTYPE;
  v_shift_id uuid;
  v_n_input  integer;
  v_n_valid  integer;
  v_subtotal numeric;
  v_diskon   numeric := COALESCE(p_diskon, 0);
  v_total    numeric;
  v_id       uuid;
  v_nomor    text;
BEGIN
  IF v_uid IS NULL OR NOT public.is_kasir() THEN
    RAISE EXCEPTION 'Hanya kasir aktif yang dapat membuat transaksi'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO v_kasir FROM public.kasir WHERE id = v_uid AND status = 'aktif';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Data kasir tidak ditemukan atau nonaktif';
  END IF;

  SELECT id INTO v_shift_id
  FROM public.shift_kasir
  WHERE kasir_id = v_uid AND status = 'buka'
  ORDER BY waktu_mulai DESC
  LIMIT 1;
  IF v_shift_id IS NULL THEN
    RAISE EXCEPTION 'Shift belum dibuka. Buka shift terlebih dahulu.';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Pesanan kosong';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_to_recordset(p_items) AS i(menu_id uuid, jumlah integer)
    WHERE i.menu_id IS NULL OR i.jumlah IS NULL OR i.jumlah <= 0
  ) THEN
    RAISE EXCEPTION 'Item pesanan tidak valid (menu_id/jumlah)';
  END IF;
  IF COALESCE(btrim(p_metode_pembayaran), '') = '' THEN
    RAISE EXCEPTION 'Metode pembayaran wajib diisi';
  END IF;

  SELECT COUNT(*), COUNT(m.id), COALESCE(SUM(m.harga * i.jumlah), 0)
    INTO v_n_input, v_n_valid, v_subtotal
  FROM jsonb_to_recordset(p_items) AS i(menu_id uuid, jumlah integer)
  LEFT JOIN public.menu_topping m
         ON m.id = i.menu_id AND m.status = 'aktif';

  IF v_n_valid <> v_n_input THEN
    RAISE EXCEPTION 'Ada menu yang tidak ditemukan atau sudah nonaktif';
  END IF;
  IF v_diskon < 0 OR v_diskon > v_subtotal THEN
    RAISE EXCEPTION 'Diskon tidak valid';
  END IF;

  v_total := v_subtotal - v_diskon;
  IF COALESCE(p_uang_diterima, 0) < v_total THEN
    RAISE EXCEPTION 'Uang diterima (%) kurang dari total (%)',
      COALESCE(p_uang_diterima, 0), v_total;
  END IF;

  INSERT INTO public.transaksi (
    nomor_transaksi, kasir_id, nama_kasir, tipe_pesanan, kuah, level_pedas,
    catatan, subtotal, diskon, total, metode_pembayaran,
    uang_diterima, kembalian, shift_id
  ) VALUES (
    'TRX-' || to_char(now() AT TIME ZONE 'Asia/Jakarta', 'YYMMDD') || '-'
            || lpad(nextval('public.seq_nomor_transaksi')::text, 5, '0'),
    v_uid, v_kasir.nama, p_tipe_pesanan, p_kuah, p_level_pedas,
    p_catatan, v_subtotal, v_diskon, v_total, btrim(p_metode_pembayaran),
    p_uang_diterima, p_uang_diterima - v_total, v_shift_id
  )
  RETURNING id, nomor_transaksi INTO v_id, v_nomor;

  INSERT INTO public.detail_transaksi
    (transaksi_id, menu_id, nama_menu, harga_satuan, jumlah, subtotal)
  SELECT v_id, m.id, m.nama, m.harga, SUM(i.jumlah)::int, m.harga * SUM(i.jumlah)
  FROM jsonb_to_recordset(p_items) AS i(menu_id uuid, jumlah integer)
  JOIN public.menu_topping m ON m.id = i.menu_id
  GROUP BY m.id, m.nama, m.harga
  ORDER BY m.id;

  -- Potong stok bahan sesuai resep. Trigger terapkan_mutasi_stok menolak
  -- dengan pesan "Stok <bahan> tidak cukup" bila stok kurang.
  INSERT INTO public.mutasi_stok (stok_id, tipe, jumlah, keterangan, dibuat_oleh, transaksi_id)
  SELECT r.stok_id, 'keluar', SUM(r.jumlah_per_porsi * d.jumlah),
         'Penjualan ' || v_nomor, v_uid, v_id
  FROM public.detail_transaksi d
  JOIN public.resep_menu r ON r.menu_id = d.menu_id
  WHERE d.transaksi_id = v_id
  GROUP BY r.stok_id
  ORDER BY r.stok_id;

  RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."buat_transaksi"("p_items" "jsonb", "p_tipe_pesanan" "text", "p_kuah" "text", "p_level_pedas" integer, "p_catatan" "text", "p_diskon" numeric, "p_metode_pembayaran" "text", "p_uang_diterima" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."buat_transaksi"("p_nomor_transaksi" "text", "p_items" "jsonb", "p_metode_pembayaran" "text", "p_uang_diterima" numeric, "p_nama_kasir" "text", "p_kasir_id" "uuid" DEFAULT "auth"."uid"(), "p_tipe_pesanan" "text" DEFAULT 'Dine In'::"text", "p_kuah" "text" DEFAULT 'Original'::"text", "p_level_pedas" integer DEFAULT 3, "p_catatan" "text" DEFAULT NULL::"text", "p_status_pesanan" "text" DEFAULT 'Diproses'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_transaksi_id uuid;
  v_subtotal numeric(14,2);
  v_total numeric(14,2);
  v_item jsonb;
  v_menu_id uuid;
  v_qty numeric(12,2);
  v_need record;
  v_kasir_id uuid;
begin
  if auth.uid() is not null
     and public.current_user_role() not in ('owner','kasir') then
    raise exception 'Akun tidak memiliki akses membuat transaksi.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang transaksi kosong.';
  end if;

  if p_tipe_pesanan not in ('Dine In','Takeaway') then
    raise exception 'Tipe pesanan tidak valid.';
  end if;

  if p_status_pesanan not in ('Menunggu','Diproses','Siap','Selesai') then
    raise exception 'Status pesanan tidak valid.';
  end if;

  select coalesce(sum(
    (x->>'harga_satuan')::numeric * (x->>'jumlah')::numeric
  ), 0)
  into v_subtotal
  from jsonb_array_elements(p_items) x;

  v_total := v_subtotal;

  if v_total <= 0 then raise exception 'Total transaksi harus lebih dari nol.'; end if;
  if lower(p_metode_pembayaran) in ('tunai','cash')
     and coalesce(p_uang_diterima,0) < v_total then
    raise exception 'Uang pembayaran kurang dari total transaksi.';
  end if;

  -- Hindari FK gagal bila user demo belum memiliki baris kasir.
  v_kasir_id := null;
  if auth.uid() is not null then
    -- Kasir tidak boleh mengirim ID kasir lain dari aplikasi.
    if public.current_user_role() = 'kasir' then
      v_kasir_id := auth.uid();
    elsif public.is_owner() and p_kasir_id is not null
      and exists (select 1 from public.kasir where id = p_kasir_id) then
      v_kasir_id := p_kasir_id;
    end if;
  elsif p_kasir_id is not null and exists (
    select 1 from public.kasir where id = p_kasir_id
  ) then
    -- Jalur ini hanya relevan untuk seed melalui SQL Editor.
    v_kasir_id := p_kasir_id;
  end if;

  insert into public.transaksi(
    nomor_transaksi, kasir_id, nama_kasir, tipe_pesanan, kuah,
    level_pedas, catatan, subtotal, diskon, total, metode_pembayaran,
    uang_diterima, kembalian, status, status_pesanan
  ) values (
    p_nomor_transaksi, v_kasir_id, coalesce(nullif(p_nama_kasir,''),'Kasir'),
    p_tipe_pesanan, p_kuah, p_level_pedas, p_catatan,
    v_subtotal, 0, v_total, p_metode_pembayaran,
    coalesce(p_uang_diterima,v_total),
    greatest(coalesce(p_uang_diterima,v_total)-v_total,0),
    'Lunas', p_status_pesanan
  ) returning id into v_transaksi_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_menu_id := nullif(v_item->>'menu_id','')::uuid;
    v_qty := (v_item->>'jumlah')::numeric;

    if v_qty <= 0 then raise exception 'Jumlah item harus lebih dari nol.'; end if;

    insert into public.detail_transaksi(
      transaksi_id, menu_id, nama_menu, harga_satuan, jumlah, subtotal
    ) values (
      v_transaksi_id, v_menu_id,
      coalesce(nullif(v_item->>'nama_menu',''),'Item'),
      (v_item->>'harga_satuan')::numeric,
      v_qty,
      (v_item->>'harga_satuan')::numeric * v_qty
    );
  end loop;

  -- Hitung kebutuhan seluruh bahan berdasarkan resep. FOR UPDATE mencegah race stok.
  for v_need in
    select m.stok_id, sum(m.qty_per_item * (x->>'jumlah')::numeric) as qty
    from jsonb_array_elements(p_items) x
    join public.mapping_menu_stok m
      on m.menu_id = (x->>'menu_id')::uuid
    group by m.stok_id
    order by m.stok_id
  loop
    update public.stok_bahan
    set stok = stok - v_need.qty, updated_at = now()
    where id = v_need.stok_id and stok >= v_need.qty;

    if not found then
      raise exception 'Stok bahan tidak mencukupi untuk bahan %.', v_need.stok_id;
    end if;

    insert into public.mutasi_stok(stok_id, tipe, jumlah, keterangan, dibuat_oleh)
    values (v_need.stok_id, 'keluar', v_need.qty,
            'Pemakaian bahan transaksi ' || p_nomor_transaksi, auth.uid());
  end loop;

  return v_transaksi_id;
end;
$$;


ALTER FUNCTION "public"."buat_transaksi"("p_nomor_transaksi" "text", "p_items" "jsonb", "p_metode_pembayaran" "text", "p_uang_diterima" numeric, "p_nama_kasir" "text", "p_kasir_id" "uuid", "p_tipe_pesanan" "text", "p_kuah" "text", "p_level_pedas" integer, "p_catatan" "text", "p_status_pesanan" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."shift_kasir" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "kasir_id" "uuid" NOT NULL,
    "waktu_mulai" timestamp with time zone DEFAULT "now"() NOT NULL,
    "waktu_selesai" timestamp with time zone,
    "modal_awal" numeric(12,2) DEFAULT 0 NOT NULL,
    "uang_akhir_fisik" numeric(12,2),
    "omzet_sistem" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_transaksi" integer DEFAULT 0 NOT NULL,
    "selisih" numeric(12,2),
    "status" "text" DEFAULT 'buka'::"text" NOT NULL,
    "catatan" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "shift_kasir_modal_awal_check" CHECK (("modal_awal" >= (0)::numeric)),
    CONSTRAINT "shift_kasir_status_check" CHECK (("status" = ANY (ARRAY['buka'::"text", 'tutup'::"text"])))
);


ALTER TABLE "public"."shift_kasir" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."buka_shift"("p_modal_awal" numeric DEFAULT 0) RETURNS "public"."shift_kasir"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.shift_kasir;
BEGIN
  IF v_uid IS NULL OR NOT public.is_kasir() THEN
    RAISE EXCEPTION 'Hanya kasir aktif yang dapat membuka shift'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF COALESCE(p_modal_awal, 0) < 0 THEN
    RAISE EXCEPTION 'Modal awal tidak boleh negatif';
  END IF;
  IF EXISTS (SELECT 1 FROM public.shift_kasir WHERE kasir_id = v_uid AND status = 'buka') THEN
    RAISE EXCEPTION 'Masih ada shift yang belum ditutup';
  END IF;

  INSERT INTO public.shift_kasir (kasir_id, modal_awal)
  VALUES (v_uid, COALESCE(p_modal_awal, 0))
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;


ALTER FUNCTION "public"."buka_shift"("p_modal_awal" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."catat_pembelian_bahan"("p_nama_pengeluaran" "text", "p_items" "jsonb", "p_kategori" "text" DEFAULT 'Bahan Baku'::"text", "p_tanggal" "date" DEFAULT CURRENT_DATE, "p_catatan" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_pengeluaran_id uuid;
  v_total numeric(14,2);
  v_item jsonb;
begin
  if auth.uid() is not null and not public.is_owner() then
    raise exception 'Hanya owner yang dapat mencatat pembelian bahan.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'Rincian bahan pembelian wajib diisi.';
  end if;

  select coalesce(sum(
    (x->>'jumlah')::numeric * (x->>'harga_satuan')::numeric
  ), 0)
  into v_total
  from jsonb_array_elements(p_items) x;

  insert into public.pengeluaran
    (tanggal, nama_pengeluaran, kategori, jumlah, harga_satuan, catatan, dibuat_oleh)
  values
    (p_tanggal, p_nama_pengeluaran, p_kategori, 1, v_total, p_catatan, auth.uid())
  returning id into v_pengeluaran_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    insert into public.pengeluaran_bahan
      (pengeluaran_id, stok_id, jumlah, harga_satuan)
    values (
      v_pengeluaran_id,
      (v_item->>'stok_id')::uuid,
      (v_item->>'jumlah')::numeric,
      (v_item->>'harga_satuan')::numeric
    );
  end loop;

  return v_pengeluaran_id;
end;
$$;


ALTER FUNCTION "public"."catat_pembelian_bahan"("p_nama_pengeluaran" "text", "p_items" "jsonb", "p_kategori" "text", "p_tanggal" "date", "p_catatan" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select role from public.profiles where id = auth.uid() and status = 'aktif' limit 1;
$$;


ALTER FUNCTION "public"."current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_jurnal_pengeluaran"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.jurnal_keuangan
    (tanggal, tipe, sumber_tabel, sumber_id, keterangan, nominal)
  values
    (new.tanggal, 'pengeluaran', 'pengeluaran', new.id,
     new.nama_pengeluaran, new.total)
  on conflict (sumber_tabel, sumber_id)
  do update set tanggal = excluded.tanggal,
                keterangan = excluded.keterangan,
                nominal = excluded.nominal;
  return new;
end;
$$;


ALTER FUNCTION "public"."fn_jurnal_pengeluaran"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_jurnal_transaksi"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.status = 'Lunas' then
    insert into public.jurnal_keuangan
      (tanggal, tipe, sumber_tabel, sumber_id, keterangan, nominal)
    values
      ((new.created_at at time zone 'Asia/Jakarta')::date, 'pemasukan', 'transaksi', new.id,
       'Penjualan ' || new.nomor_transaksi, new.total)
    on conflict (sumber_tabel, sumber_id)
    do update set tanggal = excluded.tanggal,
                  keterangan = excluded.keterangan,
                  nominal = excluded.nominal;
  else
    delete from public.jurnal_keuangan
    where sumber_tabel = 'transaksi' and sumber_id = new.id;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."fn_jurnal_transaksi"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_pengeluaran_bahan_stok"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update public.stok_bahan
  set stok = stok + new.jumlah,
      harga_satuan = new.harga_satuan,
      updated_at = now()
  where id = new.stok_id;

  if not found then
    raise exception 'Bahan baku tidak ditemukan: %', new.stok_id;
  end if;

  insert into public.mutasi_stok(stok_id, tipe, jumlah, keterangan, dibuat_oleh)
  select new.stok_id, 'masuk', new.jumlah,
         'Pembelian bahan, pengeluaran ' || new.pengeluaran_id,
         p.id
  from public.pengeluaran e
  left join public.profiles p on p.id = e.dibuat_oleh
  where e.id = new.pengeluaran_id;

  return new;
end;
$$;


ALTER FUNCTION "public"."fn_pengeluaran_bahan_stok"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    INSERT INTO public.users (id, email, nama, peran)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data ->> 'nama',
            'Pengguna Seblak'
        ),
        'kasir'
    );

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hapus_transaksi"("p_id" "uuid", "p_alasan" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_t public.transaksi%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Harus login' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF COALESCE(btrim(p_alasan), '') = '' THEN
    RAISE EXCEPTION 'Alasan penghapusan wajib diisi';
  END IF;

  SELECT * INTO v_t FROM public.transaksi WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaksi tidak ditemukan';
  END IF;

  IF public.is_owner() THEN
    NULL;  -- diizinkan
  ELSIF public.is_kasir_utama() THEN
    IF v_t.shift_id IS NULL
       OR NOT EXISTS (SELECT 1 FROM public.shift_kasir s
                      WHERE s.id = v_t.shift_id AND s.status = 'buka') THEN
      RAISE EXCEPTION 'Kasir Utama hanya dapat menghapus transaksi pada shift yang masih buka'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSE
    RAISE EXCEPTION 'Hanya Owner atau Kasir Utama yang dapat menghapus transaksi'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  PERFORM set_config('app.alasan_hapus', btrim(p_alasan), true);
  DELETE FROM public.transaksi WHERE id = p_id;
END;
$$;


ALTER FUNCTION "public"."hapus_transaksi"("p_id" "uuid", "p_alasan" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hitung_ulang_shift"("p_shift_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_omzet  numeric;
  v_jumlah integer;
  v_tunai  numeric;
BEGIN
  SELECT COALESCE(SUM(total), 0),
         COUNT(*)::int,
         COALESCE(SUM(total) FILTER (WHERE lower(metode_pembayaran) IN ('tunai', 'cash')), 0)
    INTO v_omzet, v_jumlah, v_tunai
  FROM public.transaksi
  WHERE shift_id = p_shift_id AND status = 'Lunas';

  UPDATE public.shift_kasir
     SET omzet_sistem    = v_omzet,
         total_transaksi = v_jumlah,
         selisih = CASE WHEN uang_akhir_fisik IS NULL THEN selisih
                        ELSE uang_akhir_fisik - (modal_awal + v_tunai) END
   WHERE id = p_shift_id AND status = 'tutup';
END;
$$;


ALTER FUNCTION "public"."hitung_ulang_shift"("p_shift_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_kasir"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'kasir' AND p.status = 'aktif'
  );
$$;


ALTER FUNCTION "public"."is_kasir"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_kasir_utama"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.kasir k
    JOIN public.profiles p ON p.id = k.id
    WHERE k.id = auth.uid()
      AND k.is_utama
      AND k.status = 'aktif'
      AND p.role = 'kasir'
      AND p.status = 'aktif'
  );
$$;


ALTER FUNCTION "public"."is_kasir_utama"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_owner"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'owner' AND p.status = 'aktif'
  );
$$;


ALTER FUNCTION "public"."is_owner"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."kembalikan_stok_bahan"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_old_batal boolean := (OLD.status = 'Dibatalkan' OR OLD.status_pesanan = 'Dibatalkan');
  v_new_batal boolean := (NEW.status = 'Dibatalkan' OR NEW.status_pesanan = 'Dibatalkan');
BEGIN
  IF NOT v_old_batal AND v_new_batal THEN
    INSERT INTO public.mutasi_stok (stok_id, tipe, jumlah, keterangan, dibuat_oleh, transaksi_id)
    SELECT m.stok_id, 'masuk',
           SUM(CASE m.tipe WHEN 'keluar' THEN m.jumlah ELSE -m.jumlah END),
           'Pembatalan transaksi ' || NEW.nomor_transaksi,
           auth.uid(), NEW.id
    FROM public.mutasi_stok m
    WHERE m.transaksi_id = NEW.id
    GROUP BY m.stok_id
    HAVING SUM(CASE m.tipe WHEN 'keluar' THEN m.jumlah ELSE -m.jumlah END) > 0
    ORDER BY m.stok_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."kembalikan_stok_bahan"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."laporan_keuangan"("p_dari" "date", "p_sampai" "date") RETURNS TABLE("total_omzet" numeric, "total_transaksi" integer, "total_pengeluaran" numeric, "laba_bersih" numeric)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_omzet  numeric;
  v_n      integer;
  v_keluar numeric;
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'Hanya owner yang dapat melihat laporan keuangan'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_dari IS NULL OR p_sampai IS NULL OR p_sampai < p_dari THEN
    RAISE EXCEPTION 'Rentang tanggal tidak valid';
  END IF;

  SELECT COALESCE(SUM(t.total), 0), COUNT(*)::int
    INTO v_omzet, v_n
  FROM public.transaksi t
  WHERE t.status = 'Lunas'
    AND t.created_at >= (p_dari::timestamp AT TIME ZONE 'Asia/Jakarta')
    AND t.created_at <  ((p_sampai + 1)::timestamp AT TIME ZONE 'Asia/Jakarta');

  SELECT COALESCE(SUM(p.total), 0)
    INTO v_keluar
  FROM public.pengeluaran p
  WHERE p.tanggal BETWEEN p_dari AND p_sampai;

  RETURN QUERY SELECT v_omzet, v_n, v_keluar, v_omzet - v_keluar;
END;
$$;


ALTER FUNCTION "public"."laporan_keuangan"("p_dari" "date", "p_sampai" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."lengkapi_nominal_pengeluaran"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.total IS NULL AND NEW.harga_satuan IS NOT NULL THEN
    NEW.total := NEW.jumlah * NEW.harga_satuan;
  ELSIF NEW.harga_satuan IS NULL AND NEW.total IS NOT NULL THEN
    NEW.harga_satuan := NEW.total / NEW.jumlah;
  END IF;

  IF NEW.total IS NULL THEN
    RAISE EXCEPTION 'Total pengeluaran wajib diisi';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."lengkapi_nominal_pengeluaran"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."perbarui_harga_bahan"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.stok_id IS NOT NULL THEN
    UPDATE public.stok_bahan
       SET harga_satuan = NEW.harga_satuan, updated_at = now()
     WHERE id = NEW.stok_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."perbarui_harga_bahan"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ringkas_shift_setelah_hapus"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF OLD.shift_id IS NOT NULL THEN
    PERFORM public.hitung_ulang_shift(OLD.shift_id);
  END IF;
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."ringkas_shift_setelah_hapus"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."selaraskan_harga_topping"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_harga numeric;
BEGIN
  SELECT harga_jual INTO v_harga FROM public.stok_bahan WHERE id = NEW.stok_id;
  IF v_harga IS NOT NULL THEN
    NEW.harga := v_harga;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."selaraskan_harga_topping"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_shift_transaksi"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.shift_id IS NULL AND NEW.kasir_id IS NOT NULL THEN
    SELECT id INTO NEW.shift_id
    FROM public.shift_kasir
    WHERE kasir_id = NEW.kasir_id
      AND status = 'buka'
    ORDER BY waktu_mulai DESC
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_shift_transaksi"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."setujui_permintaan_stok"("p_permintaan_id" "uuid", "p_catatan" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user_id uuid;
    v_permintaan public.permintaan_stok%ROWTYPE;
    v_stok public.stok_bahan%ROWTYPE;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Silakan login terlebih dahulu.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = v_user_id
          AND role = 'owner'
          AND status = 'aktif'
    ) THEN
        RAISE EXCEPTION 'Hanya Owner aktif yang dapat menyetujui permintaan.';
    END IF;

    SELECT *
    INTO v_permintaan
    FROM public.permintaan_stok
    WHERE id = p_permintaan_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Permintaan stok tidak ditemukan.';
    END IF;

    IF v_permintaan.status <> 'menunggu' THEN
        RAISE EXCEPTION 'Permintaan ini sudah pernah diproses.';
    END IF;

    SELECT *
    INTO v_stok
    FROM public.stok_bahan
    WHERE id = v_permintaan.stok_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Data bahan baku tidak ditemukan.';
    END IF;

    UPDATE public.stok_bahan
    SET stok = stok + v_permintaan.jumlah,
        updated_at = now()
    WHERE id = v_permintaan.stok_id;

    INSERT INTO public.mutasi_stok (
        stok_id,
        tipe,
        jumlah,
        keterangan,
        dibuat_oleh,
        pengeluaran_id
    )
    VALUES (
        v_permintaan.stok_id,
        'masuk',
        v_permintaan.jumlah,
        'Penambahan stok dari pengeluaran yang telah disetujui.',
        v_user_id,
        v_permintaan.pengeluaran_id
    );

    UPDATE public.permintaan_stok
    SET status = 'disetujui',
        diproses_oleh = v_user_id,
        catatan = p_catatan,
        tanggal_diproses = now(),
        updated_at = now()
    WHERE id = p_permintaan_id
    RETURNING * INTO v_permintaan;

    RETURN jsonb_build_object(
        'message', 'Permintaan stok berhasil disetujui.',
        'permintaan', to_jsonb(v_permintaan)
    );
END;
$$;


ALTER FUNCTION "public"."setujui_permintaan_stok"("p_permintaan_id" "uuid", "p_catatan" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."siapkan_bahan_pengeluaran"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.stok_id IS NULL AND NULLIF(btrim(NEW.bahan_nama), '') IS NOT NULL THEN
    INSERT INTO public.stok_bahan (nama_bahan, kategori, satuan, harga_satuan)
    VALUES (btrim(NEW.bahan_nama),
            COALESCE(NULLIF(btrim(NEW.kategori), ''), 'Bahan Baku'),
            COALESCE(NULLIF(btrim(NEW.bahan_satuan), ''), 'pcs'),
            NEW.harga_satuan)
    ON CONFLICT (nama_bahan) DO UPDATE SET nama_bahan = EXCLUDED.nama_bahan
    RETURNING id INTO NEW.stok_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."siapkan_bahan_pengeluaran"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sinkron_pengeluaran_ke_stok"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_delta numeric;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.stok_id IS NOT NULL THEN
      INSERT INTO public.mutasi_stok (stok_id, tipe, jumlah, keterangan, dibuat_oleh, pengeluaran_id)
      VALUES (NEW.stok_id, 'masuk', NEW.jumlah,
              'Pembelian: ' || NEW.nama_pengeluaran,
              COALESCE(NEW.dibuat_oleh, auth.uid()), NEW.id);
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.stok_id IS NOT DISTINCT FROM NEW.stok_id THEN
      IF NEW.stok_id IS NOT NULL AND NEW.jumlah <> OLD.jumlah THEN
        v_delta := NEW.jumlah - OLD.jumlah;
        INSERT INTO public.mutasi_stok (stok_id, tipe, jumlah, keterangan, dibuat_oleh, pengeluaran_id)
        VALUES (NEW.stok_id,
                CASE WHEN v_delta > 0 THEN 'masuk' ELSE 'keluar' END,
                abs(v_delta),
                'Koreksi pembelian: ' || NEW.nama_pengeluaran,
                COALESCE(auth.uid(), NEW.dibuat_oleh), NEW.id);
      END IF;
    ELSE
      IF OLD.stok_id IS NOT NULL THEN
        INSERT INTO public.mutasi_stok (stok_id, tipe, jumlah, keterangan, dibuat_oleh, pengeluaran_id)
        VALUES (OLD.stok_id, 'keluar', OLD.jumlah,
                'Koreksi pembelian (ganti bahan): ' || OLD.nama_pengeluaran,
                COALESCE(auth.uid(), NEW.dibuat_oleh), NEW.id);
      END IF;
      IF NEW.stok_id IS NOT NULL THEN
        INSERT INTO public.mutasi_stok (stok_id, tipe, jumlah, keterangan, dibuat_oleh, pengeluaran_id)
        VALUES (NEW.stok_id, 'masuk', NEW.jumlah,
                'Koreksi pembelian (ganti bahan): ' || NEW.nama_pengeluaran,
                COALESCE(auth.uid(), NEW.dibuat_oleh), NEW.id);
      END IF;
    END IF;
    RETURN NEW;

  ELSE  -- DELETE
    IF OLD.stok_id IS NOT NULL THEN
      INSERT INTO public.mutasi_stok (stok_id, tipe, jumlah, keterangan, dibuat_oleh, pengeluaran_id)
      VALUES (OLD.stok_id, 'keluar', OLD.jumlah,
              'Pembatalan pembelian: ' || OLD.nama_pengeluaran,
              auth.uid(), NULL);
    END IF;
    RETURN OLD;
  END IF;
END;
$$;


ALTER FUNCTION "public"."sinkron_pengeluaran_ke_stok"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sinkron_topping_dari_stok"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_menu_id uuid;
BEGIN
  IF NEW.harga_jual IS NOT NULL AND NEW.harga_jual > 0 THEN
    INSERT INTO public.menu_topping (nama, kategori, harga, satuan, status, stok_id)
    VALUES (NEW.nama_bahan, 'Topping', NEW.harga_jual, NEW.satuan, 'aktif', NEW.id)
    ON CONFLICT (stok_id) DO UPDATE
      SET nama   = EXCLUDED.nama,
          harga  = EXCLUDED.harga,
          status = 'aktif'
    RETURNING id INTO v_menu_id;

    INSERT INTO public.resep_menu (menu_id, stok_id, jumlah_per_porsi)
    VALUES (v_menu_id, NEW.id, 1)
    ON CONFLICT (menu_id, stok_id) DO NOTHING;
  ELSE
    UPDATE public.menu_topping SET status = 'nonaktif' WHERE stok_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sinkron_topping_dari_stok"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_kasir_ke_profiles"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, role, status)
  VALUES (NEW.id, NEW.nama, 'kasir', NEW.status)
  ON CONFLICT (id) DO UPDATE
    SET nama = EXCLUDED.nama,
        status = EXCLUDED.status
    WHERE public.profiles.role = 'kasir';   -- jangan menimpa profil owner
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_kasir_ke_profiles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."terapkan_mutasi_stok"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_delta numeric;
  v_nama  text;
  v_stok  numeric;
BEGIN
  v_delta := CASE WHEN NEW.tipe IN ('masuk','penyesuaian')
                  THEN NEW.jumlah ELSE -NEW.jumlah END;

  UPDATE public.stok_bahan
     SET stok = stok + v_delta, updated_at = now()
   WHERE id = NEW.stok_id AND stok + v_delta >= 0;

  IF NOT FOUND THEN
    SELECT nama_bahan, stok INTO v_nama, v_stok
    FROM public.stok_bahan WHERE id = NEW.stok_id;
    RAISE EXCEPTION 'Stok % tidak cukup (tersedia: %, dikurangi: %)',
      COALESCE(v_nama, '?'), COALESCE(v_stok, 0), NEW.jumlah
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."terapkan_mutasi_stok"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tolak_permintaan_stok"("p_permintaan_id" "uuid", "p_catatan" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user_id uuid;
    v_permintaan public.permintaan_stok%ROWTYPE;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Silakan login terlebih dahulu.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = v_user_id
          AND role = 'owner'
          AND status = 'aktif'
    ) THEN
        RAISE EXCEPTION 'Hanya Owner aktif yang dapat menolak permintaan.';
    END IF;

    IF COALESCE(trim(p_catatan), '') = '' THEN
        RAISE EXCEPTION 'Alasan penolakan wajib diisi.';
    END IF;

    SELECT *
    INTO v_permintaan
    FROM public.permintaan_stok
    WHERE id = p_permintaan_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Permintaan stok tidak ditemukan.';
    END IF;

    IF v_permintaan.status <> 'menunggu' THEN
        RAISE EXCEPTION 'Permintaan ini sudah pernah diproses.';
    END IF;

    UPDATE public.permintaan_stok
    SET status = 'ditolak',
        diproses_oleh = v_user_id,
        catatan = trim(p_catatan),
        tanggal_diproses = now(),
        updated_at = now()
    WHERE id = p_permintaan_id
    RETURNING * INTO v_permintaan;

    RETURN jsonb_build_object(
        'message', 'Permintaan stok berhasil ditolak.',
        'permintaan', to_jsonb(v_permintaan)
    );
END;
$$;


ALTER FUNCTION "public"."tolak_permintaan_stok"("p_permintaan_id" "uuid", "p_catatan" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tutup_shift"("p_uang_akhir_fisik" numeric, "p_catatan" "text" DEFAULT NULL::"text") RETURNS "public"."shift_kasir"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_uid    uuid := auth.uid();
  v_shift  public.shift_kasir;
  v_omzet  numeric;
  v_jumlah integer;
  v_tunai  numeric;
BEGIN
  IF v_uid IS NULL OR NOT public.is_kasir() THEN
    RAISE EXCEPTION 'Hanya kasir aktif yang dapat menutup shift'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_uang_akhir_fisik IS NULL OR p_uang_akhir_fisik < 0 THEN
    RAISE EXCEPTION 'Uang akhir fisik tidak valid';
  END IF;

  SELECT * INTO v_shift
  FROM public.shift_kasir
  WHERE kasir_id = v_uid AND status = 'buka'
  ORDER BY waktu_mulai DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tidak ada shift yang sedang buka';
  END IF;

  SELECT COALESCE(SUM(total), 0),
         COUNT(*)::int,
         COALESCE(SUM(total) FILTER (WHERE lower(metode_pembayaran) IN ('tunai', 'cash')), 0)
    INTO v_omzet, v_jumlah, v_tunai
  FROM public.transaksi
  WHERE shift_id = v_shift.id AND status = 'Lunas';

  UPDATE public.shift_kasir
     SET waktu_selesai   = now(),
         uang_akhir_fisik = p_uang_akhir_fisik,
         omzet_sistem    = v_omzet,
         total_transaksi = v_jumlah,
         selisih         = p_uang_akhir_fisik - (modal_awal + v_tunai),
         status          = 'tutup',
         catatan         = COALESCE(p_catatan, catatan)
   WHERE id = v_shift.id
  RETURNING * INTO v_shift;

  RETURN v_shift;
END;
$$;


ALTER FUNCTION "public"."tutup_shift"("p_uang_akhir_fisik" numeric, "p_catatan" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_status_pesanan"("p_transaksi_id" "uuid", "p_status" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if auth.uid() is not null
     and public.current_user_role() not in ('owner','kasir') then
    raise exception 'Tidak memiliki akses.';
  end if;
  if p_status not in ('Menunggu','Diproses','Siap','Selesai','Dibatalkan') then
    raise exception 'Status pesanan tidak valid.';
  end if;
  update public.transaksi
  set status_pesanan = p_status, updated_at = now()
  where id = p_transaksi_id
    and (
      auth.uid() is null
      or public.is_owner()
      or kasir_id = auth.uid()
    );
  if not found then raise exception 'Transaksi tidak ditemukan.'; end if;
end;
$$;


ALTER FUNCTION "public"."update_status_pesanan"("p_transaksi_id" "uuid", "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validasi_update_transaksi"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_ro int;
  v_rn int;
BEGIN
  -- 1) Izin (konteks server/SQL editor: auth.uid() NULL => dilewati)
  IF auth.uid() IS NOT NULL AND NOT public.is_owner() THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND OLD.status <> 'Menunggu' THEN
      RAISE EXCEPTION 'Status pembayaran "%" hanya dapat diubah oleh owner', OLD.status
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  -- 2) Status pembayaran
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status IN ('Dibatalkan', 'Refund') THEN
      RAISE EXCEPTION 'Transaksi berstatus "%" sudah final', OLD.status;
    END IF;
    IF NEW.status = 'Menunggu' THEN
      RAISE EXCEPTION 'Status tidak dapat dikembalikan ke Menunggu';
    END IF;
    IF NEW.status = 'Refund' AND OLD.status <> 'Lunas' THEN
      RAISE EXCEPTION 'Refund hanya untuk transaksi Lunas';
    END IF;
    IF NEW.status = 'Dibatalkan' AND OLD.status <> 'Menunggu' THEN
      RAISE EXCEPTION 'Transaksi Lunas tidak dibatalkan, gunakan Refund';
    END IF;
  END IF;

  -- 3) Status pesanan (hanya maju, kecuali Dibatalkan)
  IF NEW.status_pesanan IS DISTINCT FROM OLD.status_pesanan THEN
    IF OLD.status_pesanan IN ('Selesai', 'Dibatalkan') THEN
      RAISE EXCEPTION 'Pesanan berstatus "%" sudah final', OLD.status_pesanan;
    END IF;
    v_ro := CASE OLD.status_pesanan WHEN 'Menunggu' THEN 1 WHEN 'Diproses' THEN 2
                                    WHEN 'Siap' THEN 3 WHEN 'Selesai' THEN 4 ELSE 9 END;
    v_rn := CASE NEW.status_pesanan WHEN 'Menunggu' THEN 1 WHEN 'Diproses' THEN 2
                                    WHEN 'Siap' THEN 3 WHEN 'Selesai' THEN 4 ELSE 9 END;
    IF NEW.status_pesanan <> 'Dibatalkan' AND v_rn < v_ro THEN
      RAISE EXCEPTION 'Status pesanan tidak boleh mundur (% -> %)',
        OLD.status_pesanan, NEW.status_pesanan;
    END IF;
  END IF;

  -- 4) Sinkronisasi pembatalan
  IF NEW.status = 'Dibatalkan' THEN
    NEW.status_pesanan := 'Dibatalkan';
  ELSIF NEW.status_pesanan = 'Dibatalkan' AND OLD.status_pesanan <> 'Dibatalkan' THEN
    NEW.status := CASE NEW.status
                    WHEN 'Lunas'    THEN 'Refund'
                    WHEN 'Menunggu' THEN 'Dibatalkan'
                    ELSE NEW.status
                  END;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validasi_update_transaksi"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."detail_transaksi" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "transaksi_id" "uuid" NOT NULL,
    "menu_id" "uuid",
    "nama_menu" "text" NOT NULL,
    "harga_satuan" numeric(12,2) NOT NULL,
    "jumlah" integer NOT NULL,
    "subtotal" numeric(12,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "detail_transaksi_harga_satuan_check" CHECK (("harga_satuan" >= (0)::numeric)),
    CONSTRAINT "detail_transaksi_jumlah_check" CHECK (("jumlah" > 0)),
    CONSTRAINT "detail_transaksi_subtotal_check" CHECK (("subtotal" >= (0)::numeric))
);


ALTER TABLE "public"."detail_transaksi" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kasir" (
    "id" "uuid" NOT NULL,
    "kode_kasir" "text",
    "nama" "text" NOT NULL,
    "username" "text" NOT NULL,
    "no_telepon" "text",
    "status" "text" DEFAULT 'aktif'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_utama" boolean DEFAULT false NOT NULL,
    CONSTRAINT "kasir_status_check" CHECK (("status" = ANY (ARRAY['aktif'::"text", 'nonaktif'::"text"])))
);


ALTER TABLE "public"."kasir" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."log_transaksi_dihapus" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "transaksi_id" "uuid" NOT NULL,
    "nomor_transaksi" "text" NOT NULL,
    "data" "jsonb" NOT NULL,
    "alasan" "text",
    "dihapus_oleh" "uuid",
    "dihapus_pada" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."log_transaksi_dihapus" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."menu_topping" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nama" "text" NOT NULL,
    "kategori" "text" NOT NULL,
    "harga" numeric(12,2) NOT NULL,
    "deskripsi" "text",
    "stok" integer DEFAULT 0 NOT NULL,
    "satuan" "text" DEFAULT 'pcs'::"text",
    "status" "text" DEFAULT 'aktif'::"text" NOT NULL,
    "foto_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "stok_id" "uuid",
    CONSTRAINT "menu_topping_harga_check" CHECK (("harga" > (0)::numeric)),
    CONSTRAINT "menu_topping_status_check" CHECK (("status" = ANY (ARRAY['aktif'::"text", 'nonaktif'::"text"]))),
    CONSTRAINT "menu_topping_stok_check" CHECK (("stok" >= 0))
);


ALTER TABLE "public"."menu_topping" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mutasi_stok" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stok_id" "uuid" NOT NULL,
    "tipe" "text" NOT NULL,
    "jumlah" numeric(12,2) NOT NULL,
    "keterangan" "text",
    "dibuat_oleh" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "pengeluaran_id" "uuid",
    "transaksi_id" "uuid",
    CONSTRAINT "mutasi_stok_jumlah_check" CHECK (("jumlah" > (0)::numeric)),
    CONSTRAINT "mutasi_stok_tipe_check" CHECK (("tipe" = ANY (ARRAY['masuk'::"text", 'keluar'::"text", 'penyesuaian'::"text", 'penyesuaian_kurang'::"text"])))
);


ALTER TABLE "public"."mutasi_stok" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pengeluaran" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tanggal" "date" DEFAULT CURRENT_DATE NOT NULL,
    "nama_pengeluaran" "text" NOT NULL,
    "kategori" "text" NOT NULL,
    "jumlah" numeric(12,2) DEFAULT 1 NOT NULL,
    "harga_satuan" numeric(12,2) NOT NULL,
    "catatan" "text",
    "dibuat_oleh" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "stok_id" "uuid",
    "foto_item" "text",
    "foto_struk" "text",
    "supplier" "text",
    "waktu" time without time zone,
    "total" numeric NOT NULL,
    "bahan_nama" "text",
    "bahan_satuan" "text",
    CONSTRAINT "pengeluaran_harga_satuan_check" CHECK (("harga_satuan" >= (0)::numeric)),
    CONSTRAINT "pengeluaran_jumlah_check" CHECK (("jumlah" > (0)::numeric)),
    CONSTRAINT "pengeluaran_total_check" CHECK (("total" >= (0)::numeric))
);


ALTER TABLE "public"."pengeluaran" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permintaan_stok" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pengeluaran_id" "uuid" NOT NULL,
    "stok_id" "uuid" NOT NULL,
    "jumlah" numeric NOT NULL,
    "status" "text" DEFAULT 'menunggu'::"text" NOT NULL,
    "diajukan_oleh" "uuid",
    "diproses_oleh" "uuid",
    "catatan" "text",
    "tanggal_diproses" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "permintaan_stok_jumlah_check" CHECK (("jumlah" > (0)::numeric)),
    CONSTRAINT "permintaan_stok_status_check" CHECK (("status" = ANY (ARRAY['menunggu'::"text", 'disetujui'::"text", 'ditolak'::"text"])))
);


ALTER TABLE "public"."permintaan_stok" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "nama" "text" NOT NULL,
    "role" "text" NOT NULL,
    "status" "text" DEFAULT 'aktif'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'kasir'::"text"]))),
    CONSTRAINT "profiles_status_check" CHECK (("status" = ANY (ARRAY['aktif'::"text", 'nonaktif'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resep_menu" (
    "menu_id" "uuid" NOT NULL,
    "stok_id" "uuid" NOT NULL,
    "jumlah_per_porsi" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "resep_menu_jumlah_per_porsi_check" CHECK (("jumlah_per_porsi" > (0)::numeric))
);


ALTER TABLE "public"."resep_menu" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."seq_nomor_transaksi"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."seq_nomor_transaksi" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stok_bahan" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nama_bahan" "text" NOT NULL,
    "kategori" "text" NOT NULL,
    "satuan" "text" DEFAULT 'pcs'::"text" NOT NULL,
    "stok" numeric(12,2) DEFAULT 0 NOT NULL,
    "stok_minimum" numeric(12,2) DEFAULT 0 NOT NULL,
    "harga_satuan" numeric(12,2) DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "harga_jual" numeric,
    CONSTRAINT "stok_bahan_harga_jual_check" CHECK ((("harga_jual" IS NULL) OR ("harga_jual" > (0)::numeric))),
    CONSTRAINT "stok_bahan_harga_satuan_check" CHECK (("harga_satuan" >= (0)::numeric)),
    CONSTRAINT "stok_bahan_stok_check" CHECK (("stok" >= (0)::numeric)),
    CONSTRAINT "stok_bahan_stok_minimum_check" CHECK (("stok_minimum" >= (0)::numeric))
);


ALTER TABLE "public"."stok_bahan" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transaksi" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nomor_transaksi" "text" NOT NULL,
    "kasir_id" "uuid",
    "nama_kasir" "text" NOT NULL,
    "tipe_pesanan" "text" DEFAULT 'Dine In'::"text" NOT NULL,
    "kuah" "text",
    "level_pedas" integer,
    "catatan" "text",
    "subtotal" numeric(12,2) NOT NULL,
    "diskon" numeric(12,2) DEFAULT 0 NOT NULL,
    "total" numeric(12,2) NOT NULL,
    "metode_pembayaran" "text" NOT NULL,
    "uang_diterima" numeric(12,2) DEFAULT 0 NOT NULL,
    "kembalian" numeric(12,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'Lunas'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status_pesanan" "text" DEFAULT 'Diproses'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "shift_id" "uuid",
    CONSTRAINT "transaksi_diskon_check" CHECK (("diskon" >= (0)::numeric)),
    CONSTRAINT "transaksi_level_pedas_check" CHECK ((("level_pedas" >= 0) AND ("level_pedas" <= 10))),
    CONSTRAINT "transaksi_status_check" CHECK (("status" = ANY (ARRAY['Menunggu'::"text", 'Lunas'::"text", 'Dibatalkan'::"text", 'Refund'::"text"]))),
    CONSTRAINT "transaksi_status_pesanan_check" CHECK (("status_pesanan" = ANY (ARRAY['Menunggu'::"text", 'Diproses'::"text", 'Siap'::"text", 'Selesai'::"text", 'Dibatalkan'::"text"]))),
    CONSTRAINT "transaksi_subtotal_check" CHECK (("subtotal" >= (0)::numeric)),
    CONSTRAINT "transaksi_tipe_pesanan_check" CHECK (("tipe_pesanan" = ANY (ARRAY['Dine In'::"text", 'Takeaway'::"text"]))),
    CONSTRAINT "transaksi_total_check" CHECK (("total" >= (0)::numeric))
);


ALTER TABLE "public"."transaksi" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "nama" "text" NOT NULL,
    "nim" "text",
    "peran" "text" DEFAULT 'user'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "users_peran_check" CHECK (("peran" = ANY (ARRAY['admin'::"text", 'user'::"text", 'kasir'::"text", 'owner'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'DEPRECATED: role sekarang hanya dari public.profiles. Aman di-drop setelah dipastikan tidak dipakai aplikasi.';



CREATE OR REPLACE VIEW "public"."v_dashboard_owner" WITH ("security_invoker"='true') AS
 WITH "w" AS (
         SELECT "date_trunc"('day'::"text", ("now"() AT TIME ZONE 'Asia/Jakarta'::"text")) AS "hari",
            "date_trunc"('month'::"text", ("now"() AT TIME ZONE 'Asia/Jakarta'::"text")) AS "bulan"
        )
 SELECT ( SELECT COALESCE("sum"("t"."total"), (0)::numeric) AS "coalesce"
           FROM "public"."transaksi" "t"
          WHERE (("t"."status" = 'Lunas'::"text") AND ("t"."created_at" >= ("w"."hari" AT TIME ZONE 'Asia/Jakarta'::"text")))) AS "omzet_hari_ini",
    ( SELECT "count"(*) AS "count"
           FROM "public"."transaksi" "t"
          WHERE (("t"."status" = 'Lunas'::"text") AND ("t"."created_at" >= ("w"."hari" AT TIME ZONE 'Asia/Jakarta'::"text")))) AS "transaksi_hari_ini",
    ( SELECT COALESCE("sum"("p"."total"), (0)::numeric) AS "coalesce"
           FROM "public"."pengeluaran" "p"
          WHERE ("p"."tanggal" = ("w"."hari")::"date")) AS "pengeluaran_hari_ini",
    ( SELECT COALESCE("sum"("t"."total"), (0)::numeric) AS "coalesce"
           FROM "public"."transaksi" "t"
          WHERE (("t"."status" = 'Lunas'::"text") AND ("t"."created_at" >= ("w"."bulan" AT TIME ZONE 'Asia/Jakarta'::"text")))) AS "omzet_bulan_ini",
    ( SELECT COALESCE("sum"("p"."total"), (0)::numeric) AS "coalesce"
           FROM "public"."pengeluaran" "p"
          WHERE ("p"."tanggal" >= ("w"."bulan")::"date")) AS "pengeluaran_bulan_ini",
    ( SELECT "count"(*) AS "count"
           FROM "public"."stok_bahan"
          WHERE ("stok_bahan"."stok" <= "stok_bahan"."stok_minimum")) AS "bahan_menipis",
    ( SELECT "count"(*) AS "count"
           FROM "public"."transaksi"
          WHERE ("transaksi"."status_pesanan" = ANY (ARRAY['Menunggu'::"text", 'Diproses'::"text", 'Siap'::"text"]))) AS "pesanan_aktif",
    ( SELECT "count"(*) AS "count"
           FROM "public"."shift_kasir"
          WHERE ("shift_kasir"."status" = 'buka'::"text")) AS "shift_berjalan"
   FROM "w"
  WHERE "public"."is_owner"();


ALTER VIEW "public"."v_dashboard_owner" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_laporan_kasir_harian" WITH ("security_invoker"='true') AS
 SELECT (("created_at" AT TIME ZONE 'Asia/Jakarta'::"text"))::"date" AS "tanggal",
    "kasir_id",
    "nama_kasir",
    "metode_pembayaran",
    ("count"(*))::integer AS "jumlah_transaksi",
    "sum"("total") AS "total_penjualan",
    "sum"("diskon") AS "total_diskon"
   FROM "public"."transaksi" "t"
  WHERE ("status" = 'Lunas'::"text")
  GROUP BY ((("created_at" AT TIME ZONE 'Asia/Jakarta'::"text"))::"date"), "kasir_id", "nama_kasir", "metode_pembayaran";


ALTER VIEW "public"."v_laporan_kasir_harian" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_menu_tersedia" WITH ("security_invoker"='false') AS
 SELECT "m"."id" AS "menu_id",
    "m"."nama",
    "m"."kategori",
    "m"."harga",
    "m"."deskripsi",
    "m"."foto_url",
    "r"."porsi" AS "porsi_tersedia",
    (("r"."porsi" IS NULL) OR ("r"."porsi" > 0)) AS "tersedia"
   FROM ("public"."menu_topping" "m"
     LEFT JOIN LATERAL ( SELECT ("min"("floor"(("b"."stok" / "rm"."jumlah_per_porsi"))))::integer AS "porsi"
           FROM ("public"."resep_menu" "rm"
             JOIN "public"."stok_bahan" "b" ON (("b"."id" = "rm"."stok_id")))
          WHERE ("rm"."menu_id" = "m"."id")) "r" ON (true))
  WHERE (("m"."status" = 'aktif'::"text") AND ("public"."is_owner"() OR "public"."is_kasir"()));


ALTER VIEW "public"."v_menu_tersedia" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_penjualan_bulanan" WITH ("security_invoker"='true') AS
 SELECT ("date_trunc"('month'::"text", ("created_at" AT TIME ZONE 'Asia/Jakarta'::"text")))::"date" AS "bulan",
    ("count"(*))::integer AS "jumlah_transaksi",
    "sum"("total") AS "omzet",
    "sum"("diskon") AS "total_diskon",
    "round"("avg"("total"), 0) AS "rata_rata_transaksi"
   FROM "public"."transaksi" "t"
  WHERE (("status" = 'Lunas'::"text") AND "public"."is_owner"())
  GROUP BY (("date_trunc"('month'::"text", ("created_at" AT TIME ZONE 'Asia/Jakarta'::"text")))::"date");


ALTER VIEW "public"."v_penjualan_bulanan" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_penjualan_harian" WITH ("security_invoker"='true') AS
 SELECT (("created_at" AT TIME ZONE 'Asia/Jakarta'::"text"))::"date" AS "tanggal",
    ("count"(*))::integer AS "jumlah_transaksi",
    "sum"("total") AS "omzet",
    "sum"("diskon") AS "total_diskon",
    "round"("avg"("total"), 0) AS "rata_rata_transaksi"
   FROM "public"."transaksi" "t"
  WHERE (("status" = 'Lunas'::"text") AND "public"."is_owner"())
  GROUP BY ((("created_at" AT TIME ZONE 'Asia/Jakarta'::"text"))::"date");


ALTER VIEW "public"."v_penjualan_harian" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_penjualan_menu" WITH ("security_invoker"='true') AS
 SELECT "d"."menu_id",
    "d"."nama_menu",
    ("sum"("d"."jumlah"))::integer AS "total_terjual",
    "sum"("d"."subtotal") AS "total_penjualan"
   FROM ("public"."detail_transaksi" "d"
     JOIN "public"."transaksi" "t" ON (("t"."id" = "d"."transaksi_id")))
  WHERE (("t"."status" = 'Lunas'::"text") AND "public"."is_owner"())
  GROUP BY "d"."menu_id", "d"."nama_menu";


ALTER VIEW "public"."v_penjualan_menu" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_penjualan_metode_harian" WITH ("security_invoker"='true') AS
 SELECT (("created_at" AT TIME ZONE 'Asia/Jakarta'::"text"))::"date" AS "tanggal",
    "metode_pembayaran",
    ("count"(*))::integer AS "jumlah_transaksi",
    "sum"("total") AS "omzet"
   FROM "public"."transaksi" "t"
  WHERE (("status" = 'Lunas'::"text") AND "public"."is_owner"())
  GROUP BY ((("created_at" AT TIME ZONE 'Asia/Jakarta'::"text"))::"date"), "metode_pembayaran";


ALTER VIEW "public"."v_penjualan_metode_harian" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_penjualan_mingguan" WITH ("security_invoker"='true') AS
 SELECT ("date_trunc"('week'::"text", ("created_at" AT TIME ZONE 'Asia/Jakarta'::"text")))::"date" AS "minggu_mulai",
    ("count"(*))::integer AS "jumlah_transaksi",
    "sum"("total") AS "omzet",
    "sum"("diskon") AS "total_diskon",
    "round"("avg"("total"), 0) AS "rata_rata_transaksi"
   FROM "public"."transaksi" "t"
  WHERE (("status" = 'Lunas'::"text") AND "public"."is_owner"())
  GROUP BY (("date_trunc"('week'::"text", ("created_at" AT TIME ZONE 'Asia/Jakarta'::"text")))::"date");


ALTER VIEW "public"."v_penjualan_mingguan" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_pesanan_aktif" WITH ("security_invoker"='true') AS
 SELECT "id",
    "nomor_transaksi",
    "created_at",
    "nama_kasir",
    "tipe_pesanan",
    "kuah",
    "level_pedas",
    "catatan",
    "status_pesanan",
    "status" AS "status_bayar",
    "total",
    ( SELECT "jsonb_agg"("jsonb_build_object"('nama', "d"."nama_menu", 'jumlah', "d"."jumlah") ORDER BY "d"."created_at") AS "jsonb_agg"
           FROM "public"."detail_transaksi" "d"
          WHERE ("d"."transaksi_id" = "t"."id")) AS "item"
   FROM "public"."transaksi" "t"
  WHERE ("status_pesanan" = ANY (ARRAY['Menunggu'::"text", 'Diproses'::"text", 'Siap'::"text"]));


ALTER VIEW "public"."v_pesanan_aktif" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_ringkasan_shift" WITH ("security_invoker"='true') AS
 SELECT "s"."id",
    "s"."kasir_id",
    "k"."nama" AS "nama_kasir",
    "s"."status",
    "s"."waktu_mulai",
    "s"."waktu_selesai",
    "s"."modal_awal",
    "s"."uang_akhir_fisik",
    "s"."selisih",
    "s"."catatan",
        CASE
            WHEN ("s"."status" = 'buka'::"text") THEN COALESCE("x"."omzet", (0)::numeric)
            ELSE "s"."omzet_sistem"
        END AS "omzet",
        CASE
            WHEN ("s"."status" = 'buka'::"text") THEN COALESCE("x"."jumlah", 0)
            ELSE "s"."total_transaksi"
        END AS "total_transaksi"
   FROM (("public"."shift_kasir" "s"
     LEFT JOIN "public"."kasir" "k" ON (("k"."id" = "s"."kasir_id")))
     LEFT JOIN LATERAL ( SELECT "sum"("t"."total") AS "omzet",
            ("count"(*))::integer AS "jumlah"
           FROM "public"."transaksi" "t"
          WHERE (("t"."shift_id" = "s"."id") AND ("t"."status" = 'Lunas'::"text"))) "x" ON (true));


ALTER VIEW "public"."v_ringkasan_shift" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_riwayat_transaksi" WITH ("security_invoker"='true') AS
 SELECT "id",
    "nomor_transaksi",
    "created_at",
    "nama_kasir",
    "metode_pembayaran",
    "subtotal",
    "diskon",
    "total",
    "status" AS "status_bayar",
    "status_pesanan",
    ( SELECT (COALESCE("sum"("d"."jumlah"), (0)::bigint))::integer AS "coalesce"
           FROM "public"."detail_transaksi" "d"
          WHERE ("d"."transaksi_id" = "t"."id")) AS "jumlah_item"
   FROM "public"."transaksi" "t";


ALTER VIEW "public"."v_riwayat_transaksi" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_stok_menipis" WITH ("security_invoker"='true') AS
 SELECT "id",
    "nama_bahan",
    "kategori",
    "satuan",
    "stok",
    "stok_minimum",
    ("stok_minimum" - "stok") AS "kekurangan"
   FROM "public"."stok_bahan"
  WHERE (("stok" <= "stok_minimum") AND "public"."is_owner"());


ALTER VIEW "public"."v_stok_menipis" OWNER TO "postgres";


ALTER TABLE ONLY "public"."detail_transaksi"
    ADD CONSTRAINT "detail_transaksi_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kasir"
    ADD CONSTRAINT "kasir_kode_kasir_key" UNIQUE ("kode_kasir");



ALTER TABLE ONLY "public"."kasir"
    ADD CONSTRAINT "kasir_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kasir"
    ADD CONSTRAINT "kasir_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."log_transaksi_dihapus"
    ADD CONSTRAINT "log_transaksi_dihapus_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menu_topping"
    ADD CONSTRAINT "menu_topping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menu_topping"
    ADD CONSTRAINT "menu_topping_stok_id_key" UNIQUE ("stok_id");



ALTER TABLE ONLY "public"."mutasi_stok"
    ADD CONSTRAINT "mutasi_stok_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pengeluaran"
    ADD CONSTRAINT "pengeluaran_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permintaan_stok"
    ADD CONSTRAINT "permintaan_stok_pengeluaran_id_key" UNIQUE ("pengeluaran_id");



ALTER TABLE ONLY "public"."permintaan_stok"
    ADD CONSTRAINT "permintaan_stok_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resep_menu"
    ADD CONSTRAINT "resep_menu_pkey" PRIMARY KEY ("menu_id", "stok_id");



ALTER TABLE ONLY "public"."shift_kasir"
    ADD CONSTRAINT "shift_kasir_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stok_bahan"
    ADD CONSTRAINT "stok_bahan_nama_bahan_key" UNIQUE ("nama_bahan");



ALTER TABLE ONLY "public"."stok_bahan"
    ADD CONSTRAINT "stok_bahan_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaksi"
    ADD CONSTRAINT "transaksi_nomor_transaksi_key" UNIQUE ("nomor_transaksi");



ALTER TABLE ONLY "public"."transaksi"
    ADD CONSTRAINT "transaksi_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_detail_transaksi_header" ON "public"."detail_transaksi" USING "btree" ("transaksi_id");



CREATE INDEX "idx_detail_transaksi_trx_id" ON "public"."detail_transaksi" USING "btree" ("transaksi_id");



CREATE INDEX "idx_kasir_status" ON "public"."kasir" USING "btree" ("status");



CREATE INDEX "idx_mutasi_stok_pengeluaran_id" ON "public"."mutasi_stok" USING "btree" ("pengeluaran_id") WHERE ("pengeluaran_id" IS NOT NULL);



CREATE INDEX "idx_mutasi_stok_stok" ON "public"."mutasi_stok" USING "btree" ("stok_id", "created_at" DESC);



CREATE INDEX "idx_mutasi_stok_stok_id" ON "public"."mutasi_stok" USING "btree" ("stok_id");



CREATE INDEX "idx_mutasi_stok_transaksi_id" ON "public"."mutasi_stok" USING "btree" ("transaksi_id") WHERE ("transaksi_id" IS NOT NULL);



CREATE INDEX "idx_pengeluaran_stok_id" ON "public"."pengeluaran" USING "btree" ("stok_id") WHERE ("stok_id" IS NOT NULL);



CREATE INDEX "idx_pengeluaran_tanggal" ON "public"."pengeluaran" USING "btree" ("tanggal" DESC);



CREATE INDEX "idx_permintaan_stok_created" ON "public"."permintaan_stok" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_permintaan_stok_status" ON "public"."permintaan_stok" USING "btree" ("status");



CREATE INDEX "idx_resep_menu_stok_id" ON "public"."resep_menu" USING "btree" ("stok_id");



CREATE INDEX "idx_shift_kasir_date" ON "public"."shift_kasir" USING "btree" ("waktu_mulai" DESC);



CREATE INDEX "idx_transaksi_created" ON "public"."transaksi" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_transaksi_created_at" ON "public"."transaksi" USING "btree" ("created_at");



CREATE INDEX "idx_transaksi_kasir" ON "public"."transaksi" USING "btree" ("kasir_id");



CREATE INDEX "idx_transaksi_kasir_id" ON "public"."transaksi" USING "btree" ("kasir_id");



CREATE INDEX "idx_transaksi_pesanan_aktif" ON "public"."transaksi" USING "btree" ("created_at") WHERE ("status_pesanan" = ANY (ARRAY['Menunggu'::"text", 'Diproses'::"text", 'Siap'::"text"]));



CREATE INDEX "idx_transaksi_shift_id" ON "public"."transaksi" USING "btree" ("shift_id");



CREATE INDEX "idx_transaksi_status_created" ON "public"."transaksi" USING "btree" ("status", "created_at");



CREATE UNIQUE INDEX "uq_mutasi_stok_pengeluaran_masuk" ON "public"."mutasi_stok" USING "btree" ("pengeluaran_id") WHERE (("pengeluaran_id" IS NOT NULL) AND ("tipe" = 'masuk'::"text"));



CREATE UNIQUE INDEX "uq_shift_buka_per_kasir" ON "public"."shift_kasir" USING "btree" ("kasir_id") WHERE ("status" = 'buka'::"text");



CREATE OR REPLACE TRIGGER "trg_00_lengkapi_nominal_pengeluaran" BEFORE INSERT ON "public"."pengeluaran" FOR EACH ROW EXECUTE FUNCTION "public"."lengkapi_nominal_pengeluaran"();



CREATE OR REPLACE TRIGGER "trg_arsipkan_transaksi_dihapus" BEFORE DELETE ON "public"."transaksi" FOR EACH ROW EXECUTE FUNCTION "public"."arsipkan_transaksi_dihapus"();



CREATE OR REPLACE TRIGGER "trg_batasi_edit_transaksi" BEFORE UPDATE OF "catatan", "kuah", "level_pedas", "tipe_pesanan" ON "public"."transaksi" FOR EACH ROW EXECUTE FUNCTION "public"."batasi_edit_transaksi"();



CREATE OR REPLACE TRIGGER "trg_jurnal_pengeluaran" AFTER INSERT OR UPDATE OF "tanggal", "nama_pengeluaran", "jumlah", "harga_satuan" ON "public"."pengeluaran" FOR EACH ROW EXECUTE FUNCTION "public"."fn_jurnal_pengeluaran"();



CREATE OR REPLACE TRIGGER "trg_jurnal_transaksi" AFTER INSERT OR UPDATE OF "status", "total", "created_at" ON "public"."transaksi" FOR EACH ROW EXECUTE FUNCTION "public"."fn_jurnal_transaksi"();



CREATE OR REPLACE TRIGGER "trg_kembalikan_stok_bahan" AFTER UPDATE ON "public"."transaksi" FOR EACH ROW WHEN ((("old"."status" IS DISTINCT FROM "new"."status") OR ("old"."status_pesanan" IS DISTINCT FROM "new"."status_pesanan"))) EXECUTE FUNCTION "public"."kembalikan_stok_bahan"();



CREATE OR REPLACE TRIGGER "trg_pengeluaran_stok_del" BEFORE DELETE ON "public"."pengeluaran" FOR EACH ROW EXECUTE FUNCTION "public"."sinkron_pengeluaran_ke_stok"();



CREATE OR REPLACE TRIGGER "trg_pengeluaran_stok_iu" AFTER INSERT OR UPDATE OF "jumlah", "stok_id" ON "public"."pengeluaran" FOR EACH ROW EXECUTE FUNCTION "public"."sinkron_pengeluaran_ke_stok"();



CREATE OR REPLACE TRIGGER "trg_perbarui_harga_bahan" AFTER INSERT ON "public"."pengeluaran" FOR EACH ROW EXECUTE FUNCTION "public"."perbarui_harga_bahan"();



CREATE OR REPLACE TRIGGER "trg_ringkas_shift_setelah_hapus" AFTER DELETE ON "public"."transaksi" FOR EACH ROW EXECUTE FUNCTION "public"."ringkas_shift_setelah_hapus"();



CREATE OR REPLACE TRIGGER "trg_selaraskan_harga_topping" BEFORE UPDATE ON "public"."menu_topping" FOR EACH ROW WHEN (("new"."stok_id" IS NOT NULL)) EXECUTE FUNCTION "public"."selaraskan_harga_topping"();



CREATE OR REPLACE TRIGGER "trg_set_shift_transaksi" BEFORE INSERT ON "public"."transaksi" FOR EACH ROW EXECUTE FUNCTION "public"."set_shift_transaksi"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at" BEFORE UPDATE ON "public"."kasir" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at" BEFORE UPDATE ON "public"."menu_topping" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at" BEFORE UPDATE ON "public"."pengeluaran" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at" BEFORE UPDATE ON "public"."permintaan_stok" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at" BEFORE UPDATE ON "public"."resep_menu" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at" BEFORE UPDATE ON "public"."stok_bahan" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at" BEFORE UPDATE ON "public"."transaksi" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_siapkan_bahan_pengeluaran" BEFORE INSERT ON "public"."pengeluaran" FOR EACH ROW EXECUTE FUNCTION "public"."siapkan_bahan_pengeluaran"();



CREATE OR REPLACE TRIGGER "trg_sinkron_topping_dari_stok" AFTER UPDATE OF "harga_jual" ON "public"."stok_bahan" FOR EACH ROW WHEN (("old"."harga_jual" IS DISTINCT FROM "new"."harga_jual")) EXECUTE FUNCTION "public"."sinkron_topping_dari_stok"();



CREATE OR REPLACE TRIGGER "trg_sync_kasir_profiles" AFTER INSERT OR UPDATE ON "public"."kasir" FOR EACH ROW EXECUTE FUNCTION "public"."sync_kasir_ke_profiles"();



CREATE OR REPLACE TRIGGER "trg_terapkan_mutasi_stok" AFTER INSERT ON "public"."mutasi_stok" FOR EACH ROW EXECUTE FUNCTION "public"."terapkan_mutasi_stok"();



CREATE OR REPLACE TRIGGER "trg_validasi_update_transaksi" BEFORE UPDATE ON "public"."transaksi" FOR EACH ROW WHEN ((("old"."status" IS DISTINCT FROM "new"."status") OR ("old"."status_pesanan" IS DISTINCT FROM "new"."status_pesanan"))) EXECUTE FUNCTION "public"."validasi_update_transaksi"();



ALTER TABLE ONLY "public"."detail_transaksi"
    ADD CONSTRAINT "detail_transaksi_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "public"."menu_topping"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."detail_transaksi"
    ADD CONSTRAINT "detail_transaksi_transaksi_id_fkey" FOREIGN KEY ("transaksi_id") REFERENCES "public"."transaksi"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mutasi_stok"
    ADD CONSTRAINT "fk_mutasi_pengeluaran" FOREIGN KEY ("pengeluaran_id") REFERENCES "public"."pengeluaran"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pengeluaran"
    ADD CONSTRAINT "fk_pengeluaran_stok" FOREIGN KEY ("stok_id") REFERENCES "public"."stok_bahan"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."kasir"
    ADD CONSTRAINT "kasir_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."menu_topping"
    ADD CONSTRAINT "menu_topping_stok_id_fkey" FOREIGN KEY ("stok_id") REFERENCES "public"."stok_bahan"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mutasi_stok"
    ADD CONSTRAINT "mutasi_stok_dibuat_oleh_fkey" FOREIGN KEY ("dibuat_oleh") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mutasi_stok"
    ADD CONSTRAINT "mutasi_stok_stok_id_fkey" FOREIGN KEY ("stok_id") REFERENCES "public"."stok_bahan"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mutasi_stok"
    ADD CONSTRAINT "mutasi_stok_transaksi_id_fkey" FOREIGN KEY ("transaksi_id") REFERENCES "public"."transaksi"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pengeluaran"
    ADD CONSTRAINT "pengeluaran_dibuat_oleh_fkey" FOREIGN KEY ("dibuat_oleh") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."permintaan_stok"
    ADD CONSTRAINT "permintaan_stok_diajukan_oleh_fkey" FOREIGN KEY ("diajukan_oleh") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."permintaan_stok"
    ADD CONSTRAINT "permintaan_stok_diproses_oleh_fkey" FOREIGN KEY ("diproses_oleh") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."permintaan_stok"
    ADD CONSTRAINT "permintaan_stok_pengeluaran_id_fkey" FOREIGN KEY ("pengeluaran_id") REFERENCES "public"."pengeluaran"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."permintaan_stok"
    ADD CONSTRAINT "permintaan_stok_stok_id_fkey" FOREIGN KEY ("stok_id") REFERENCES "public"."stok_bahan"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resep_menu"
    ADD CONSTRAINT "resep_menu_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "public"."menu_topping"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resep_menu"
    ADD CONSTRAINT "resep_menu_stok_id_fkey" FOREIGN KEY ("stok_id") REFERENCES "public"."stok_bahan"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."shift_kasir"
    ADD CONSTRAINT "shift_kasir_kasir_id_fkey" FOREIGN KEY ("kasir_id") REFERENCES "public"."kasir"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transaksi"
    ADD CONSTRAINT "transaksi_kasir_id_fkey" FOREIGN KEY ("kasir_id") REFERENCES "public"."kasir"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transaksi"
    ADD CONSTRAINT "transaksi_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "public"."shift_kasir"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Pengguna membaca baris sendiri" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Pengguna menambah baris sendiri" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Pengguna mengubah baris sendiri" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "app_akses" ON "public"."detail_transaksi" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "app_akses" ON "public"."kasir" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "app_akses" ON "public"."menu_topping" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "app_akses" ON "public"."mutasi_stok" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "app_akses" ON "public"."pengeluaran" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "app_akses" ON "public"."profiles" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "app_akses" ON "public"."shift_kasir" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "app_akses" ON "public"."stok_bahan" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "app_akses" ON "public"."transaksi" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "detail_insert_parent" ON "public"."detail_transaksi" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."transaksi" "t"
  WHERE (("t"."id" = "detail_transaksi"."transaksi_id") AND ("public"."is_owner"() OR ("t"."kasir_id" = "auth"."uid"()))))));



CREATE POLICY "detail_owner_delete" ON "public"."detail_transaksi" FOR DELETE TO "authenticated" USING ("public"."is_owner"());



CREATE POLICY "detail_owner_update" ON "public"."detail_transaksi" FOR UPDATE TO "authenticated" USING ("public"."is_owner"()) WITH CHECK ("public"."is_owner"());



CREATE POLICY "detail_read_parent" ON "public"."detail_transaksi" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."transaksi" "t"
  WHERE (("t"."id" = "detail_transaksi"."transaksi_id") AND ("public"."is_owner"() OR ("t"."kasir_id" = "auth"."uid"()))))));



CREATE POLICY "detail_select" ON "public"."detail_transaksi" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."transaksi" "t"
  WHERE ("t"."id" = "detail_transaksi"."transaksi_id"))));



ALTER TABLE "public"."detail_transaksi" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kasir" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "kasir_delete" ON "public"."kasir" FOR DELETE TO "authenticated" USING ("public"."is_owner"());



CREATE POLICY "kasir_insert" ON "public"."kasir" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_owner"());



CREATE POLICY "kasir_owner_delete" ON "public"."kasir" FOR DELETE TO "authenticated" USING ("public"."is_owner"());



CREATE POLICY "kasir_owner_insert" ON "public"."kasir" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_owner"());



CREATE POLICY "kasir_owner_update" ON "public"."kasir" FOR UPDATE TO "authenticated" USING ("public"."is_owner"()) WITH CHECK ("public"."is_owner"());



CREATE POLICY "kasir_read_self_owner" ON "public"."kasir" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."is_owner"()));



CREATE POLICY "kasir_select" ON "public"."kasir" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."is_owner"()));



CREATE POLICY "kasir_update" ON "public"."kasir" FOR UPDATE TO "authenticated" USING ("public"."is_owner"()) WITH CHECK ("public"."is_owner"());



CREATE POLICY "log_hapus_select" ON "public"."log_transaksi_dihapus" FOR SELECT TO "authenticated" USING ("public"."is_owner"());



ALTER TABLE "public"."log_transaksi_dihapus" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "menu_delete" ON "public"."menu_topping" FOR DELETE TO "authenticated" USING ("public"."is_owner"());



CREATE POLICY "menu_insert" ON "public"."menu_topping" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_owner"());



CREATE POLICY "menu_select" ON "public"."menu_topping" FOR SELECT TO "authenticated" USING (("public"."is_owner"() OR ("public"."is_kasir"() AND ("status" = 'aktif'::"text"))));



ALTER TABLE "public"."menu_topping" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "menu_topping_delete" ON "public"."menu_topping" FOR DELETE TO "authenticated", "anon" USING (true);



CREATE POLICY "menu_topping_insert" ON "public"."menu_topping" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "menu_topping_select" ON "public"."menu_topping" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "menu_topping_update" ON "public"."menu_topping" FOR UPDATE TO "authenticated", "anon" USING (true) WITH CHECK (true);



CREATE POLICY "menu_update" ON "public"."menu_topping" FOR UPDATE TO "authenticated" USING ("public"."is_owner"()) WITH CHECK ("public"."is_owner"());



CREATE POLICY "mutasi_owner_write" ON "public"."mutasi_stok" TO "authenticated" USING ("public"."is_owner"()) WITH CHECK ("public"."is_owner"());



CREATE POLICY "mutasi_read_auth" ON "public"."mutasi_stok" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "mutasi_select" ON "public"."mutasi_stok" FOR SELECT TO "authenticated" USING ("public"."is_owner"());



ALTER TABLE "public"."mutasi_stok" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pengeluaran" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pengeluaran_delete" ON "public"."pengeluaran" FOR DELETE TO "authenticated" USING ("public"."is_owner"());



CREATE POLICY "pengeluaran_insert" ON "public"."pengeluaran" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_owner"() AND (("dibuat_oleh" IS NULL) OR ("dibuat_oleh" = "auth"."uid"()))));



CREATE POLICY "pengeluaran_owner_all" ON "public"."pengeluaran" TO "authenticated" USING ("public"."is_owner"()) WITH CHECK ("public"."is_owner"());



CREATE POLICY "pengeluaran_select" ON "public"."pengeluaran" FOR SELECT TO "authenticated" USING ("public"."is_owner"());



CREATE POLICY "pengeluaran_update" ON "public"."pengeluaran" FOR UPDATE TO "authenticated" USING ("public"."is_owner"()) WITH CHECK ("public"."is_owner"());



CREATE POLICY "permintaan_all" ON "public"."permintaan_stok" TO "authenticated" USING ("public"."is_owner"()) WITH CHECK ("public"."is_owner"());



ALTER TABLE "public"."permintaan_stok" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_owner_insert" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_owner"());



CREATE POLICY "profiles_owner_update" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ("public"."is_owner"()) WITH CHECK ("public"."is_owner"());



CREATE POLICY "profiles_read_self_or_owner" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."is_owner"()));



CREATE POLICY "profiles_select" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."is_owner"()));



CREATE POLICY "resep_all" ON "public"."resep_menu" TO "authenticated" USING ("public"."is_owner"()) WITH CHECK ("public"."is_owner"());



ALTER TABLE "public"."resep_menu" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shift_insert_self" ON "public"."shift_kasir" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_owner"() OR ("kasir_id" = "auth"."uid"())));



ALTER TABLE "public"."shift_kasir" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shift_read_owner_or_self" ON "public"."shift_kasir" FOR SELECT TO "authenticated" USING (("public"."is_owner"() OR ("kasir_id" = "auth"."uid"())));



CREATE POLICY "shift_select" ON "public"."shift_kasir" FOR SELECT TO "authenticated" USING ((("kasir_id" = "auth"."uid"()) OR "public"."is_owner"()));



CREATE POLICY "shift_update_owner_or_self" ON "public"."shift_kasir" FOR UPDATE TO "authenticated" USING (("public"."is_owner"() OR ("kasir_id" = "auth"."uid"()))) WITH CHECK (("public"."is_owner"() OR ("kasir_id" = "auth"."uid"())));



ALTER TABLE "public"."stok_bahan" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stok_owner_write" ON "public"."stok_bahan" TO "authenticated" USING ("public"."is_owner"()) WITH CHECK ("public"."is_owner"());



CREATE POLICY "stok_read_auth" ON "public"."stok_bahan" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "stok_select" ON "public"."stok_bahan" FOR SELECT TO "authenticated" USING ("public"."is_owner"());



CREATE POLICY "stok_update" ON "public"."stok_bahan" FOR UPDATE TO "authenticated" USING ("public"."is_owner"()) WITH CHECK ("public"."is_owner"());



ALTER TABLE "public"."transaksi" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "transaksi_cashier_insert" ON "public"."transaksi" FOR INSERT TO "authenticated" WITH CHECK ((("public"."current_user_role"() = ANY (ARRAY['owner'::"text", 'kasir'::"text"])) AND ("public"."is_owner"() OR ("kasir_id" = "auth"."uid"()))));



CREATE POLICY "transaksi_owner_update" ON "public"."transaksi" FOR UPDATE TO "authenticated" USING ("public"."is_owner"()) WITH CHECK ("public"."is_owner"());



CREATE POLICY "transaksi_read_owner_or_self" ON "public"."transaksi" FOR SELECT TO "authenticated" USING (("public"."is_owner"() OR ("kasir_id" = "auth"."uid"())));



CREATE POLICY "transaksi_select" ON "public"."transaksi" FOR SELECT TO "authenticated" USING (("public"."is_owner"() OR ("public"."is_kasir"() AND ("kasir_id" = "auth"."uid"()))));



CREATE POLICY "transaksi_update" ON "public"."transaksi" FOR UPDATE TO "authenticated" USING (("public"."is_owner"() OR ("public"."is_kasir"() AND ("kasir_id" = "auth"."uid"())))) WITH CHECK (("public"."is_owner"() OR ("public"."is_kasir"() AND ("kasir_id" = "auth"."uid"()))));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_select_own" ON "public"."users" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "users_update_own" ON "public"."users" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."arsipkan_transaksi_dihapus"() TO "anon";
GRANT ALL ON FUNCTION "public"."arsipkan_transaksi_dihapus"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."arsipkan_transaksi_dihapus"() TO "service_role";



GRANT ALL ON FUNCTION "public"."batasi_edit_transaksi"() TO "anon";
GRANT ALL ON FUNCTION "public"."batasi_edit_transaksi"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."batasi_edit_transaksi"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."buat_pengeluaran_dengan_permintaan"("p_nama_pengeluaran" "text", "p_stok_id" "uuid", "p_jumlah" numeric, "p_harga_satuan" numeric, "p_kategori" "text", "p_tanggal" "date", "p_catatan" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."buat_pengeluaran_dengan_permintaan"("p_nama_pengeluaran" "text", "p_stok_id" "uuid", "p_jumlah" numeric, "p_harga_satuan" numeric, "p_kategori" "text", "p_tanggal" "date", "p_catatan" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."buat_pengeluaran_dengan_permintaan"("p_nama_pengeluaran" "text", "p_stok_id" "uuid", "p_jumlah" numeric, "p_harga_satuan" numeric, "p_kategori" "text", "p_tanggal" "date", "p_catatan" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."buat_pengeluaran_dengan_permintaan"("p_nama_pengeluaran" "text", "p_stok_id" "uuid", "p_jumlah" numeric, "p_harga_satuan" numeric, "p_kategori" "text", "p_tanggal" "date", "p_catatan" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."buat_transaksi"("p_items" "jsonb", "p_tipe_pesanan" "text", "p_kuah" "text", "p_level_pedas" integer, "p_catatan" "text", "p_diskon" numeric, "p_metode_pembayaran" "text", "p_uang_diterima" numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."buat_transaksi"("p_items" "jsonb", "p_tipe_pesanan" "text", "p_kuah" "text", "p_level_pedas" integer, "p_catatan" "text", "p_diskon" numeric, "p_metode_pembayaran" "text", "p_uang_diterima" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."buat_transaksi"("p_items" "jsonb", "p_tipe_pesanan" "text", "p_kuah" "text", "p_level_pedas" integer, "p_catatan" "text", "p_diskon" numeric, "p_metode_pembayaran" "text", "p_uang_diterima" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."buat_transaksi"("p_nomor_transaksi" "text", "p_items" "jsonb", "p_metode_pembayaran" "text", "p_uang_diterima" numeric, "p_nama_kasir" "text", "p_kasir_id" "uuid", "p_tipe_pesanan" "text", "p_kuah" "text", "p_level_pedas" integer, "p_catatan" "text", "p_status_pesanan" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."buat_transaksi"("p_nomor_transaksi" "text", "p_items" "jsonb", "p_metode_pembayaran" "text", "p_uang_diterima" numeric, "p_nama_kasir" "text", "p_kasir_id" "uuid", "p_tipe_pesanan" "text", "p_kuah" "text", "p_level_pedas" integer, "p_catatan" "text", "p_status_pesanan" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."buat_transaksi"("p_nomor_transaksi" "text", "p_items" "jsonb", "p_metode_pembayaran" "text", "p_uang_diterima" numeric, "p_nama_kasir" "text", "p_kasir_id" "uuid", "p_tipe_pesanan" "text", "p_kuah" "text", "p_level_pedas" integer, "p_catatan" "text", "p_status_pesanan" "text") TO "service_role";



GRANT ALL ON TABLE "public"."shift_kasir" TO "service_role";
GRANT SELECT ON TABLE "public"."shift_kasir" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."buka_shift"("p_modal_awal" numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."buka_shift"("p_modal_awal" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."buka_shift"("p_modal_awal" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."catat_pembelian_bahan"("p_nama_pengeluaran" "text", "p_items" "jsonb", "p_kategori" "text", "p_tanggal" "date", "p_catatan" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."catat_pembelian_bahan"("p_nama_pengeluaran" "text", "p_items" "jsonb", "p_kategori" "text", "p_tanggal" "date", "p_catatan" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."catat_pembelian_bahan"("p_nama_pengeluaran" "text", "p_items" "jsonb", "p_kategori" "text", "p_tanggal" "date", "p_catatan" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_jurnal_pengeluaran"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_jurnal_pengeluaran"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_jurnal_pengeluaran"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_jurnal_transaksi"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_jurnal_transaksi"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_jurnal_transaksi"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_pengeluaran_bahan_stok"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_pengeluaran_bahan_stok"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_pengeluaran_bahan_stok"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."hapus_transaksi"("p_id" "uuid", "p_alasan" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hapus_transaksi"("p_id" "uuid", "p_alasan" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hapus_transaksi"("p_id" "uuid", "p_alasan" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."hitung_ulang_shift"("p_shift_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hitung_ulang_shift"("p_shift_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_kasir"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_kasir"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_kasir"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_kasir_utama"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_kasir_utama"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_kasir_utama"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_owner"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_owner"() TO "service_role";



GRANT ALL ON FUNCTION "public"."kembalikan_stok_bahan"() TO "anon";
GRANT ALL ON FUNCTION "public"."kembalikan_stok_bahan"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."kembalikan_stok_bahan"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."laporan_keuangan"("p_dari" "date", "p_sampai" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."laporan_keuangan"("p_dari" "date", "p_sampai" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."laporan_keuangan"("p_dari" "date", "p_sampai" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."lengkapi_nominal_pengeluaran"() TO "anon";
GRANT ALL ON FUNCTION "public"."lengkapi_nominal_pengeluaran"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."lengkapi_nominal_pengeluaran"() TO "service_role";



GRANT ALL ON FUNCTION "public"."perbarui_harga_bahan"() TO "anon";
GRANT ALL ON FUNCTION "public"."perbarui_harga_bahan"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."perbarui_harga_bahan"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ringkas_shift_setelah_hapus"() TO "anon";
GRANT ALL ON FUNCTION "public"."ringkas_shift_setelah_hapus"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ringkas_shift_setelah_hapus"() TO "service_role";



GRANT ALL ON FUNCTION "public"."selaraskan_harga_topping"() TO "anon";
GRANT ALL ON FUNCTION "public"."selaraskan_harga_topping"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."selaraskan_harga_topping"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_shift_transaksi"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_shift_transaksi"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_shift_transaksi"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."setujui_permintaan_stok"("p_permintaan_id" "uuid", "p_catatan" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."setujui_permintaan_stok"("p_permintaan_id" "uuid", "p_catatan" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."setujui_permintaan_stok"("p_permintaan_id" "uuid", "p_catatan" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."setujui_permintaan_stok"("p_permintaan_id" "uuid", "p_catatan" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."siapkan_bahan_pengeluaran"() TO "anon";
GRANT ALL ON FUNCTION "public"."siapkan_bahan_pengeluaran"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."siapkan_bahan_pengeluaran"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sinkron_pengeluaran_ke_stok"() TO "anon";
GRANT ALL ON FUNCTION "public"."sinkron_pengeluaran_ke_stok"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sinkron_pengeluaran_ke_stok"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sinkron_topping_dari_stok"() TO "anon";
GRANT ALL ON FUNCTION "public"."sinkron_topping_dari_stok"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sinkron_topping_dari_stok"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_kasir_ke_profiles"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_kasir_ke_profiles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_kasir_ke_profiles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."terapkan_mutasi_stok"() TO "anon";
GRANT ALL ON FUNCTION "public"."terapkan_mutasi_stok"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."terapkan_mutasi_stok"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."tolak_permintaan_stok"("p_permintaan_id" "uuid", "p_catatan" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."tolak_permintaan_stok"("p_permintaan_id" "uuid", "p_catatan" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."tolak_permintaan_stok"("p_permintaan_id" "uuid", "p_catatan" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."tolak_permintaan_stok"("p_permintaan_id" "uuid", "p_catatan" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."tutup_shift"("p_uang_akhir_fisik" numeric, "p_catatan" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."tutup_shift"("p_uang_akhir_fisik" numeric, "p_catatan" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."tutup_shift"("p_uang_akhir_fisik" numeric, "p_catatan" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_status_pesanan"("p_transaksi_id" "uuid", "p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_status_pesanan"("p_transaksi_id" "uuid", "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_status_pesanan"("p_transaksi_id" "uuid", "p_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validasi_update_transaksi"() TO "anon";
GRANT ALL ON FUNCTION "public"."validasi_update_transaksi"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validasi_update_transaksi"() TO "service_role";


















GRANT ALL ON TABLE "public"."detail_transaksi" TO "service_role";
GRANT SELECT ON TABLE "public"."detail_transaksi" TO "authenticated";



GRANT ALL ON TABLE "public"."kasir" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."kasir" TO "authenticated";



GRANT ALL ON TABLE "public"."log_transaksi_dihapus" TO "service_role";
GRANT SELECT ON TABLE "public"."log_transaksi_dihapus" TO "authenticated";



GRANT ALL ON TABLE "public"."menu_topping" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."menu_topping" TO "authenticated";



GRANT ALL ON TABLE "public"."mutasi_stok" TO "service_role";
GRANT SELECT ON TABLE "public"."mutasi_stok" TO "authenticated";



GRANT ALL ON TABLE "public"."pengeluaran" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."pengeluaran" TO "authenticated";



GRANT ALL ON TABLE "public"."permintaan_stok" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."permintaan_stok" TO "authenticated";



GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT SELECT ON TABLE "public"."profiles" TO "authenticated";



GRANT ALL ON TABLE "public"."resep_menu" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."resep_menu" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."seq_nomor_transaksi" TO "anon";
GRANT ALL ON SEQUENCE "public"."seq_nomor_transaksi" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."seq_nomor_transaksi" TO "service_role";



GRANT ALL ON TABLE "public"."stok_bahan" TO "service_role";
GRANT SELECT ON TABLE "public"."stok_bahan" TO "authenticated";



GRANT UPDATE("harga_jual") ON TABLE "public"."stok_bahan" TO "authenticated";



GRANT ALL ON TABLE "public"."transaksi" TO "service_role";
GRANT SELECT ON TABLE "public"."transaksi" TO "authenticated";



GRANT UPDATE("tipe_pesanan") ON TABLE "public"."transaksi" TO "authenticated";



GRANT UPDATE("kuah") ON TABLE "public"."transaksi" TO "authenticated";



GRANT UPDATE("level_pedas") ON TABLE "public"."transaksi" TO "authenticated";



GRANT UPDATE("catatan") ON TABLE "public"."transaksi" TO "authenticated";



GRANT UPDATE("status") ON TABLE "public"."transaksi" TO "authenticated";



GRANT UPDATE("status_pesanan") ON TABLE "public"."transaksi" TO "authenticated";



GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."v_dashboard_owner" TO "service_role";
GRANT SELECT ON TABLE "public"."v_dashboard_owner" TO "authenticated";



GRANT ALL ON TABLE "public"."v_laporan_kasir_harian" TO "service_role";
GRANT SELECT ON TABLE "public"."v_laporan_kasir_harian" TO "authenticated";



GRANT ALL ON TABLE "public"."v_menu_tersedia" TO "service_role";
GRANT SELECT ON TABLE "public"."v_menu_tersedia" TO "authenticated";



GRANT ALL ON TABLE "public"."v_penjualan_bulanan" TO "service_role";
GRANT SELECT ON TABLE "public"."v_penjualan_bulanan" TO "authenticated";



GRANT ALL ON TABLE "public"."v_penjualan_harian" TO "service_role";
GRANT SELECT ON TABLE "public"."v_penjualan_harian" TO "authenticated";



GRANT ALL ON TABLE "public"."v_penjualan_menu" TO "service_role";
GRANT SELECT ON TABLE "public"."v_penjualan_menu" TO "authenticated";



GRANT ALL ON TABLE "public"."v_penjualan_metode_harian" TO "service_role";
GRANT SELECT ON TABLE "public"."v_penjualan_metode_harian" TO "authenticated";



GRANT ALL ON TABLE "public"."v_penjualan_mingguan" TO "service_role";
GRANT SELECT ON TABLE "public"."v_penjualan_mingguan" TO "authenticated";



GRANT ALL ON TABLE "public"."v_pesanan_aktif" TO "service_role";
GRANT SELECT ON TABLE "public"."v_pesanan_aktif" TO "authenticated";



GRANT ALL ON TABLE "public"."v_ringkasan_shift" TO "service_role";
GRANT SELECT ON TABLE "public"."v_ringkasan_shift" TO "authenticated";



GRANT ALL ON TABLE "public"."v_riwayat_transaksi" TO "service_role";
GRANT SELECT ON TABLE "public"."v_riwayat_transaksi" TO "authenticated";



GRANT ALL ON TABLE "public"."v_stok_menipis" TO "service_role";
GRANT SELECT ON TABLE "public"."v_stok_menipis" TO "authenticated";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































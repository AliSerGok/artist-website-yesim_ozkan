# Deploy

Site Cloudflare Workers üzerinde (`opennextjs-cloudflare`). İçerik D1'de, görseller R2'de.
Alan adı Natro'da kayıtlı, DNS ve hosting Cloudflare'de.

Bütün komutlar proje kökünde çalışır.

---

## Her seferinde: Node 22

```bash
nvm use 22 && node -v     # v22.x
```

Wrangler Node 22 istiyor. Varsayılan sürüm 20 olduğu için `npm run deploy`
ilk adımda sessizce durur — **"deploy ettim ama değişmedi"nin bir numaralı sebebi budur.**

---

## Sıra: önce veritabanı, sonra kod

Migration'lar yeni sütun ekler; canlıdaki eski kod onları bilmediği için
görmezden gelir ve site migration boyunca çalışmaya devam eder.
Ters sırada yeni kod henüz var olmayan sütunları arar ve sayfalar kırılır.

### 1 · Bak

```bash
git status                                                # ağaç temiz mi
npx wrangler d1 migrations list yesim-content --remote    # bekleyen migration
npx wrangler deployments list                             # canlıdaki sürüm
```

### 2 · Geri dönüş noktasını al

```bash
npx wrangler d1 time-travel info yesim-content
```

Çıktıdaki bookmark'ı kaydet. 30 gün geçerli, geri dönüş:

```bash
npx wrangler d1 time-travel restore yesim-content --bookmark=<bookmark>
```

### 3 · Veritabanı

```bash
npm run db:migrate        # uzak D1, y ile onaylanır
```

### 4 · Kod

```bash
npm run deploy            # build + deploy
```

---

## Sonra kontrol

- `yesimozkan.com/tr` — anasayfa
- `/tr/exhibitions` — "devamını gör", görsellerin yerleşimi
- bir sergi adına tıkla — sergi sayfası açılmalı
- bir seri sayfası — metin genişliği, eser adları
- `/admin` — giriş; İşler ve Sergiler sayfalarının başındaki ortak yazı tipi kartları

Sayfa eski görünüyorsa önce **Cmd+Shift+R**, sonra önbelleği atlayarak:

```bash
curl -sI "https://yesimozkan.com/tr/exhibitions?x=$(date +%s)" | head -5
```

---

## Yerel çalışma

```bash
npm run dev               # yerel veritabanı kopyası (.wrangler/state)
npm run db:migrate:local  # migration'ları yerele uygula
npm run db:reset:local    # sıfırla + seed + yönetici
```

`npm run dev:remote` ve `npm run preview` **gerçek** D1 ve R2'ye bağlanır —
panelden kayıt yaparsan canlı içeriği değiştirirsin. Gezinmek güvenli.

---

## Migration yazarken

Dosyalar `migrations/`, sırayla numaralı. D1'in iki tuzağı var:

- **İfade derinliği en fazla 100.** İç içe uzun `replace()` zincirleri reddedilir;
  işi birkaç adıma böl (bkz. `0009_exhibition_slug_names.sql`).
- **Dize içindeki `;` ve `--`** ifade bölücüsünü şaşırtır. `char(59)` ve
  `char(45)||char(45)` kullan.

Türkçe metin NFD gelebilir (`ü` = `u` + birleşen işaret), o yüzden SQL'de harf
katlarken hem tek karakteri hem birleşen işaretleri ayıkla.

Uygulamadan önce bir kopyada dene:

```bash
sqlite3 /tmp/t.db ".read migrations/0001_init.sql" ... ".read migrations/000N_yeni.sql"
```

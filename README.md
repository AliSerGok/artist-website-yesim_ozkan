# yesimozkan.com

Yeşim Özkan'ın sanatçı sitesi. Next.js 16 (App Router), Cloudflare Workers
üzerinde; içerik D1'de, görseller R2'de. Sanatçı tüm içeriği `/admin`
panelinden kendisi yönetir; panel Cloudflare Access ile kapalıdır.

```
/                     → /tr
/tr, /en              seçilmiş işler: seri kartları + tek işler, teknik filtresi
/tr/series/<slug>     seri sayfası (serinin tüm işleri)
/tr/works/<slug>      tek eser sayfası — ızgaradan tıklanınca tam ekran
                      görüntüleyici açılır, doğrudan açılınca bu sayfa gelir
/tr/exhibitions       öne çıkan sergiler (görsel + metin)
/tr/about             hakkında: portre, künye, içerik blokları, tam katılım listesi
/tr/contact           iletişim
/admin                yönetim paneli (Cloudflare Access arkasında)
/media/<key>          R2'deki görseller
```

## Yerel geliştirme

Node 22 gerekir (`.nvmrc` var, `nvm use` yeterli).

```bash
nvm use
npm install
npm run db:reset:local     # yerel D1'i kurar, içeriği ve yer tutucu görselleri yükler
npm run dev                # http://localhost:3000
```

Yerelde Cloudflare Access yoktur; `/admin` doğrudan açılır. Bu yalnızca
`NODE_ENV=development` içindir — dağıtılmış bir kopyada Access ayarlanmamışsa
panel 404 verir.

Faydalı komutlar:

```bash
npm run db:console:local "SELECT slug, medium, series_id FROM works ORDER BY sort_order"
npm run db:seed:sql        # src/lib/seed.ts → migrations/0002_seed.sql
npm run seed:images        # seed/images/ → R2 + kayıtlara bağla (yereldeki)
npm run db:reset:local     # veritabanını komple sıfırdan kurar
npm run cf:typegen         # wrangler.jsonc değişince binding tiplerini yeniler
npm run preview            # üretim derlemesini yerelde Worker olarak çalıştırır
```

## Cloudflare kurulumu (bir kez)

```bash
npx wrangler login
npm run cf:d1:create       # çıktıdaki database_id'yi wrangler.jsonc'a yaz (iki yere)
npm run cf:r2:create
npm run cf:kv:create       # çıktıdaki id'yi wrangler.jsonc'a yaz
npm run cf:typegen
npm run db:migrate         # şemayı ve başlangıç içeriğini uzak D1'e uygular
npm run seed:images:remote # yer tutucu görselleri uzak R2'ye yükler
npm run deploy
```

`wrangler.jsonc` içindeki üç `PLACEHOLDER_…` değeri doldurulmadan dağıtım
çalışmaz. `vars.SITE_URL` alanını da gerçek alan adıyla güncelle.

## Alan adı

Alan adını Cloudflare'e ekle (nameserver'ları Cloudflare'e yönlendir), sonra
Workers → yesim → Settings → Domains & Routes'tan `yesimozkan.com` ve
`www.yesimozkan.com` bağla. Access, alan adının Cloudflare üzerinde olmasını
şart koşar.

## Cloudflare Access (panelin kilidi)

1. Zero Trust → Access → Applications → **Add an application** → *Self-hosted*.
2. Application domain: `yesimozkan.com`, path: `admin`.
3. Policy: **Allow**, Include → *Emails* → Yeşim'in e-postası. Başka kimse yok.
4. Login method: One-time PIN (e-postaya kod) veya Google.
5. Uygulamanın Overview sekmesindeki **Application Audience (AUD) Tag**'i ve
   ekip alan adını (`<takım>.cloudflareaccess.com`) `wrangler.jsonc` içindeki
   `CF_ACCESS_AUD` ve `CF_ACCESS_TEAM_DOMAIN` değerlerine yaz, sonra
   `npm run deploy`.

Sonuç: yetkisiz bir ziyaretçi `/admin`'e giderse Cloudflare'in kendi ekranını
görür; istek uygulamaya hiç ulaşmaz. Sitede hiçbir yerde giriş bağlantısı
yoktur ve `/admin` `noindex` gönderir. Uygulama ayrıca Access'in imzaladığı
JWT'yi kendisi de doğrular: token yoksa veya geçersizse panel 404 verir.
`workers.dev` adresini Workers ayarlarından kapat ki Access atlanamasın.

## İçerik yapısı

**İşler** ya tek başına durur ya da bir **seriye** bağlanır. Seriye bağlı işler
ana ızgarada tek tek görünmez; onun yerine seri, arkasında istiflenmiş kağıt
izlenimi veren tek bir kart olur ve işler serinin kendi sayfasında listelenir.
Bir işi seriye bağlamak, işin düzenleme sayfasındaki “Seri” alanından yapılır.
Seri silinirse işleri silinmez, ana ızgaraya döner.

Başlangıç içeriği (21 iş, 3 seri) kurgudur ve bilerek her yöne yayılır — 3:1
panoramadan 1:3 dar dikeye, avuç içi kadar kağıt işlerinden 220 cm'lik resme —
böylece düzen gerçek işler yüklenmeden önce her oranda sınanmış olur.

**Yer tutucu görseller.** `seed/images/` altındaki 30 soyut görsel (her iş,
her sergi, atölye portresi ve hakkında sayfasının görselleri) depoda duruyor; `npm run seed:images` bunları R2'ye
yazıp kayıtlara bağlıyor, yani sıfır kurulumda site boş kutularla değil
resimlerle açılıyor. Yeşim panelden gerçek bir fotoğraf yüklediğinde yer tutucu
otomatik siliniyor. Görselleri yeniden üretmek gerekirse
`npm run seed:images:render` — bunun için Google Chrome ve `cwebp`
(`brew install webp`) gerekiyor; üretilen dosyalar depoda olduğu için normal
kullanımda ikisine de ihtiyaç yok.

**Sergiler ile katılımlar ayrı.** Sergiler sayfasında yalnızca öne çıkan
sergiler var; her biri kapak görseli, kısa metni ve varsa sergi sayfası
bağlantısıyla, görsel ve metin dönüşümlü olarak. Katıldığı her şeyin tam
listesi hakkında sayfasının altında düz satırlar hâlinde duruyor. İkisi
panelde ayrı bölümler: “Sergiler” ve “Katılımlar”.

**Hakkında sayfası blok blok kuruluyor.** Üstte portre, giriş cümlesi ve
künye; altında sıralayabildiğin bloklar: metin, tek görsel, ikili görsel ve
alıntı. Panelden blok ekleniyor, taşınıyor, siliniyor — bu düğmeler formu da
kaydettiği için yazdıkların kaybolmuyor.

**Izgarada hover.** Üzerine gelinen tek iş kendi çerçevesinin içinde büyüyor,
seri kartı ise arkasındaki istiflenmiş kağıtlarla birlikte komple öne
çıkıyor. Diğer işler soluklaşmıyor.

**Telefonda.** Başlık hamburger menüye dönüşüyor, tam ekran menü açılıyor;
sergiler ve katılım listesi tek sütuna iniyor; görüntüleyicinin bilgi barı
sabit yükseklikten çıkıp akışa giriyor ve gerekirse kendi içinde kayıyor.

**Bir dansçı ve dört kuş var.** Dansçı, `data-perch` işaretli görsel
çerçevelerinin üstüne tüneyip dans ediyor: işaretçiyi takip ediyor, gittiği
yöne dönüyor, üstünde yer olmayan ya da başlıktaki öğeleri atlıyor. Kuşlar
başlıkta yaşıyor — menü bağlantılarına konuyor, zıplıyor, geriniyor, ara sıra
birbirini kovalıyor ya da yan yana diziliyor; imleç yaklaşınca ürküp uçuyor ve
sayfa değişince hep birlikte havalanıyor. İkisi de tamamen dekoratif:
`pointer-events: none`, yani hiçbir tıklamayı yutmuyorlar. Dansçı dokunmatik
ekranda, kuşların ikisi dar ekranda ve menü açıkken gizleniyor;
`prefers-reduced-motion` açıksa hiçbiri yüklenmiyor.

**Tam ekran görüntüleyici.** Izgarada bir işe tıklamak eseri tam ekran açar:
ok tuşları / önceki-sonraki ile gezinme, esere tıklayınca tıklanan noktadan
2.2× yakınlaşma, sürükleyerek veya iki parmakla kaydırma, `Esc` ile sırayla
zoom → açıklama paneli → görüntüleyici kapanışı, `i` ile bilgi barını açıp
kapatma. Bar kapanınca eser büyür; açıklama üç satıra kırpılır ve gerçekten
kırpıldıysa “devamını oku” çıkar.

Görüntüleyici açılırken adres çubuğu esere ait URL'e döner, geri tuşu onu
kapatır. Aynı URL doğrudan açıldığında (paylaşım, arama motoru, yeni sekme)
sunucudan gerçek bir eser sayfası gelir — yani kartlar hem hızlı görüntüleyiciyi
hem paylaşılabilir bağlantıyı verir.

## Mimari notlar

**Sayfa üretimi.** Sayfalar her istekte D1'den okunarak render edilir. Böylece
panelde yapılan değişiklik anında yayına girer, önbellek temizleme adımı
gerekmez. Trafik bu ölçekte ücretsiz katmanın çok altında kalır.

**Görseller.** Panelden yüklenen dosya *tarayıcıda* iki boyuta küçültülüp
WebP'ye çevrilir (2400px `-full`, 900px `-grid`) ve R2'ye yazılır; sunucu
tarafında görsel işleme yoktur. `/media/...` uzun ömürlü, değişmez önbellek
başlıklarıyla servis eder. Görsel yoksa tasarımdaki taralı yer tutucu görünür.

**İki dil.** Her metin D1'de `_tr` / `_en` sütun çifti olarak durur; İngilizce
boş bırakılırsa Türkçesi kullanılır. Diller ayrı URL'lerde (`/tr`, `/en`).

**Kod haritası.**

```
src/lib/content.ts             okuma tarafı (D1, binding yoksa seed'e düşer)
src/lib/admin-db.ts            yazma tarafı
src/lib/access.ts              Access JWT doğrulaması
src/lib/seed.ts                başlangıç içeriği (0002_seed.sql'in kaynağı)
seed/images/                   yer tutucu eser görselleri
src/lib/cards.ts               kayıt → kart dönüşümleri
src/components/work-gallery.tsx  ızgara: seri kartları ve tek işler
src/components/image-frame.tsx   orana kırpan görsel çerçevesi
src/components/lightbox.tsx      tam ekran görüntüleyici
src/components/studio-dancer.tsx tünenen dansçı
src/components/perched-birds.tsx başlıkta yaşayan kuşlar
src/app/(site)/                genel site
src/app/(admin)/               yönetim paneli
migrations/                    D1 şeması
```

Görüntüleyici `document.body`'ye portal ile basılır: sayfa açılış animasyonu
`<main>` üzerinde kimlik matrisi bıraktığından, orada kalsaydı `position: fixed`
viewport'a değil `<main>`'e sabitlenirdi.

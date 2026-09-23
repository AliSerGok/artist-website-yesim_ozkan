# yesimozkan.com

Yeşim Özkan'ın sanatçı sitesi. Next.js 16 (App Router), Cloudflare Workers
üzerinde; içerik D1'de, görseller R2'de. Sanatçı tüm içeriği `/admin`
panelinden kendisi yönetir; panele e-posta ve şifreyle girilir.

```
/                     → /tr
/tr, /en              ana sayfa: seçilen slaytlar ikişer ikişer dönen tam ekran
/tr/works             seçilmiş işler: seri kartları + tek işler, teknik filtresi
/tr/series/<slug>     seri sayfası (serinin tüm işleri)
/tr/works/<slug>      tek eser sayfası — ızgaradan tıklanınca tam ekran
                      görüntüleyici açılır, doğrudan açılınca bu sayfa gelir
/tr/exhibitions       öne çıkan sergiler (görsel + metin)
/tr/about             hakkında: portre, künye, içerik blokları, tam katılım listesi
/tr/contact           iletişim
/admin                yönetim paneli (e-posta + şifre)
/admin/login          panelin giriş ekranı
/media/<key>          R2'deki görseller
```

## Yerel geliştirme

Node 22 gerekir (`.nvmrc` var, `nvm use` yeterli).

```bash
nvm use
npm install
npx wrangler login         # bir kez; binding'ler uzak kaynaklara bağlanıyor
npm run dev                # http://localhost:3000
```

**Tek veritabanı vardır.** `wrangler.jsonc` içindeki D1, R2 ve KV binding'leri
`"remote": true` işaretli: `next dev` de, yayındaki Worker da Cloudflare'deki
aynı veritabanına ve aynı kovaya bakar. Yani localhost'ta panelden yaptığın
kayıt canlı siteye de işler, sildiğin görsel gerçekten silinir. Karşılığında
"yereldeki içerik başka, canlıdaki başka" karışıklığı yoktur.

Bunun iki sonucu var: çalışmak için internete ve `wrangler login` oturumuna
ihtiyaç duyarsın, ve her sorgu ağ üzerinden gittiği için sayfalar yereldeki
kadar anında açılmaz.

Gerçekten izole bir kopyayla oynamak istersen `wrangler.jsonc` içindeki
`"remote": true` satırlarını kaldır, sonra:

```bash
npm run db:reset:local     # yerel D1'i kurar, içeriği ve yer tutucu görselleri yükler
                           # sonunda yerel hesabı da açar: yesim@yerel.test / yesim1234
```

Next 16 aynı dizin için tek bir dev sunucusuna izin verdiğinden, ikinci bir
kopya farklı portta bile açılmaz.

Faydalı komutlar:

```bash
npm run admin:set -- --email … --password "…"   # panel hesabı açar / şifresini sıfırlar
npm run admin:set -- --email … --remove         # hesabı siler
npm run admin:set -- … --local                  # aynısını yerel kopya için yapar
npm run db:console:local "SELECT slug, medium FROM works ORDER BY sort_order"
npm run db:seed:sql        # src/lib/seed.ts → migrations/0002_seed.sql
npm run seed:images:remote # seed/images/ → R2 + kayıtlara bağla
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
npm run admin:set -- --email yesim@... --password "…"   # panel hesabı
npm run seed:images:remote # yer tutucu görselleri uzak R2'ye yükler
npm run deploy
```

`wrangler.jsonc` içindeki üç `PLACEHOLDER_…` değeri doldurulmadan dağıtım
çalışmaz. `vars.SITE_URL` alanını da gerçek alan adıyla güncelle.

## Alan adı

Alan adını Cloudflare'e ekle (nameserver'ları Cloudflare'e yönlendir), sonra
Workers → yesim → Settings → Domains & Routes'tan `yesimozkan.com` ve
`www.yesimozkan.com` bağla.

## Panelin kilidi

Panele `/admin/login` üzerinden e-posta ve şifreyle giriliyor. Hesap
veritabanında duruyor; şifreden saklanan tek şey PBKDF2-SHA256 özeti
(`src/lib/password.ts`).

İlk hesabı terminalden açıyorsun — giriş ekranının kendisi hesap açmaz, yoksa
siteyi ilk bulan panelin sahibi olurdu:

```bash
npm run admin:set -- --email yesim@site.com --password "…"
```

Aynı komut, aynı adresle ikinci kez çalıştırıldığında şifreyi sıfırlar:
unutulan şifrenin çıkış yolu bu. Şifre ya da adres değişikliği panelin
**Hesap** sekmesinden de yapılabilir; ikisi de mevcut şifreyi soruyor.

Girişten sonra tarayıcıda 30 gün ömürlü bir çerez kalıyor: içinde rastgele bir
anahtar var, veritabanında ise yalnızca onun SHA-256'sı — veritabanının bir
kopyası kimsenin oturumunu açmaya yetmiyor. Çerez yalnızca `/admin` yoluna
gönderiliyor; `HttpOnly` ve `SameSite=Lax`. Şifre değişince o tarayıcı hariç bütün oturumlar
düşüyor; **Hesap** sekmesindeki "Bütün oturumları kapat" düğmesi ise hepsini,
kendi tarayıcın dâhil, kapatıyor.

Üst üste sekiz yanlış denemeden sonra hesap 15 dakika hiçbir şifreye cevap
vermiyor. Giriş ekranı hatanın adreste mi şifrede mi olduğunu söylemiyor ve
olmayan bir adres için de doğru hesapla aynı süreyi harcıyor.

Sitede hiçbir yerde panele bağlantı yok, `/admin` `noindex` gönderiyor ve
`robots.txt` kapatıyor. Panelin her sayfası ve yazan her işlem oturumu
yeniden kontrol ediyor (`src/lib/auth.ts`).

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

**Ana sayfa slaytları iki türlü.** Panelin **Ana sayfa** sekmesinde sıralanan
her slayt ya sitedeki bir **işi** gösterir — adı, yılı ve tekniği kendiliğinden
yazılır, slayt işin sayfasına götürür — ya da yalnızca ana sayfa için
**yüklenmiş bir görseli**: sergiden bir kare, bir afiş, atölyeden bir fotoğraf.
Yüklenen görselin başlığı, başlıktan sonraki italik metni ve alt satırı elle
yazılıyor; bağlantı isteğe bağlı, boş bırakılırsa slayt tıklanmıyor.

Slaytlar ikişer ikişer ekranı paylaşıyor ve altı saniyede bir sonraki çifte
geçiliyor; panel her slaytın kaçıncı ekranda, sağda mı solda mı duracağını
yazıyor. Telefonda çift yan yana değil alt alta duruyor. Gösterecek bir şeyi
olmayan slayt — görseli yüklenmemiş ya da işi yayından kaldırılmış olan —
sitede atlanıyor ama panelde duruyor; hiç slayt kalmazsa işler sayfasının
başındaki altı iş dönüyor, yani sayfa hiçbir durumda boş kalmıyor.

**Sergiler ile katılımlar ayrı.** Sergiler sayfasında yalnızca öne çıkan
sergiler var; her biri kapak görseli, kısa metni ve varsa sergi sayfası
bağlantısıyla, görsel ve metin dönüşümlü olarak. Katıldığı her şeyin tam
listesi hakkında sayfasının altında düz satırlar hâlinde duruyor. İkisi
panelde ayrı bölümler: “Sergiler” ve “Katılımlar”.

**Katılımlar başlıklara ayrılıyor.** Katılım listesi istenildiği kadar ara
başlığa bölünüyor — Sergiler, Yarışmalar, Ödüller, Yayınlar… Başlıklar kendi
aralarında, satırlar da kendi başlığı içinde ↑↓ ile sıralanıyor. Boş kalan ya da
gizlenen başlık sitede hiç görünmüyor. Bir başlık silinirse satırları silinmiyor;
listenin en üstünde başlıksız kalıyor, oradan başka bir başlığa taşınabiliyor.
Sağdaki “kişisel / grup” etiketi satır başına seçimlik — sergilerde anlamlı,
yarışma ve ödül satırlarında boş bırakılıyor.

**Hakkında sayfası blok blok kuruluyor.** Üstte portre, giriş cümlesi ve
künye; altında sıralanabilen bloklar. Üç blok türü var: **şerit**, **başlık** ve
**alıntı**. Bir şeritte en çok üç alan olur ve her alan ya metin ya görseldir —
yani tek görsel, yan yana iki fotoğraf, ya da iki fotoğrafın yanında bir
paragraf, hepsi aynı bloğun ayarı. Alanlar şeridin içinde ←→ ile, bloklar kendi
aralarında ↑↓ ile taşınıyor. Künye sütunları da sınırsız: ekleniyor, taşınıyor,
siliniyor; her sütunun satır sayısı serbest (her satıra bir şey). Bütün bu
düğmeler formu da kaydettiği için yazdıkların kaybolmuyor.

Tek metin alanlı şerit okuma genişliğinde akıyor; çok alanlı şerit tam
genişlikte sütunlara ayrılıyor ve telefonda tek sütuna iniyor. Başlıklar
akışta, tanıttıkları bloğa yakın duruyor. Eskiden kaydedilmiş bir sayfa
(metin / görsel / ikili görsel blokları) okunurken kendiliğinden şeritlere
çevriliyor, elle bir şey yapmak gerekmiyor.

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
`prefers-reduced-motion` açıksa hiçbiri yüklenmiyor. İkisi de panelden
(“Animasyonlar”) tek tek kapatılabiliyor; kapalı olanın kodu ziyaretçiye hiç
gönderilmiyor.

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
src/lib/auth.ts                giriş, oturum, şifre değişimi
src/lib/password.ts            PBKDF2 özetleme (panel ve scripts/admin-user.ts)
src/lib/seed.ts                başlangıç içeriği (0002_seed.sql'in kaynağı)
                               ve animasyon anahtarlarının varsayılanları
seed/images/                   yer tutucu eser görselleri
src/lib/cards.ts               kayıt → kart dönüşümleri
src/components/home-slideshow.tsx ana sayfanın ikili slaytı
src/components/work-gallery.tsx  ızgara: seri kartları ve tek işler
src/components/image-frame.tsx   orana kırpan görsel çerçevesi
src/components/lightbox.tsx      tam ekran görüntüleyici
src/components/studio-dancer.tsx tünenen dansçı
src/components/perched-birds.tsx başlıkta yaşayan kuşlar
src/app/(site)/                genel site
src/app/(admin)/               yönetim paneli — (panel)/ oturum ister,
                               login/ istemez
scripts/admin-user.ts          hesabı açan / şifresini sıfırlayan komut
migrations/                    D1 şeması
```

Görüntüleyici `document.body`'ye portal ile basılır: sayfa açılış animasyonu
`<main>` üzerinde kimlik matrisi bıraktığından, orada kalsaydı `position: fixed`
viewport'a değil `<main>`'e sabitlenirdi.

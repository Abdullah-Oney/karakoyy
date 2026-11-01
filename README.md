# Karaköy Güllüoğlu — Kişiye Özel Dijital Kutu Deneyimi

Bu klasör, Karaköy Güllüoğlu için hazırlanan kişiye özel NFC kutu/hediye mesajı konsept demosudur. Statik HTML, CSS ve JavaScript ile hazırlanmıştır; GitHub Pages üzerinde yayımlanabilir.

## Demo akışı

1. Sayfa açıldığında Karaköy illüstrasyonu ilk 3 saniye tam görünür.
2. Ardından çevredeki illüstrasyon piksellere ayrılarak dağılır ve merkezdeki isim plakası kalır.
3. İsim ve Güllüoğlu logosu ayrı bir şeffaf PNG olarak indirilebilir.
4. Destekleyen masaüstü tarayıcılarda animasyon WebM video olarak kaydedilebilir.
5. Sunum demosu panelinden `Kenan`, `Nadir` gibi örnek isimler veya hediye notu denenebilir.

## Dosya yapısı

- `index.html` — Tek sayfalık deneyim.
- `styles.css` — Mobil uyumlu tasarım.
- `app.js` — Piksel dağılma animasyonu, kişiselleştirme, PNG ve WebM dışa aktarma.
- `assets/karakoy-illustration.png` — Koyu yeşil/altın Karaköy illüstrasyonu.
- `assets/gulluoglu-logo.png` — Şeffaf arka planlı marka logosu.

## GitHub Pages ile yayınlama

1. ZIP arşivini açın.
2. İçindeki `index.html`, `styles.css`, `app.js` ve `assets` klasörünü repository ana dizinine yükleyin.
3. GitHub Pages kaynağı `main` ve klasör `/ (root)` olarak seçili olsun.
4. NFC etiketine bu sayfanın adresini veya markanın kendi alan adında tanımlanacak kısa bağlantıyı yazın.

## Kişiselleştirme demo parametreleri

Statik demo, URL parametreleriyle örnek alıcı bilgisi alabilir:

- Kendisi için: `?name=Kenan&mode=self`
- Hediye: `?name=Kenan&mode=gift&note=Iyi%20ki%20dogdun&from=Elif`

Bunlar yalnızca sunum kolaylığı içindir. Gerçek siparişlerde müşteri notunu URL'ye düz metin olarak yazmayın. NFC etiketi siparişe özel rastgele bir token içeren URL açmalı; sunucu bu token üzerinden doğru mesajı, alıcıyı ve göndericiyi güvenli biçimde getirmelidir.

## Üretim sürümü için gerekenler

Bu demo GitHub Pages üzerinde statik çalışır. Sipariş sistemi veya müşteri veritabanına bağlanmaz. Ticari kullanımda:

- Her kişiselleştirilmiş kutu için tahmin edilmesi zor, benzersiz bir token üretilmeli.
- Token sunucu tarafında sipariş kaydıyla eşleştirilmeli; kişisel mesaj URL parametresinde açıkça taşınmamalı.
- Hediye mesajı sipariş sırasında alınmalı ve gönderim öncesi doğrulanmalı.
- Müşteri mesajı, ad-soyad ve olası medya içerikleri için KVKK aydınlatması, saklama süresi ve erişim yetkileri tanımlanmalı.
- Instagram'da dosya paylaşımı Web Share API destekli mobil tarayıcıda paylaşım penceresi açabilir. Diğer tarayıcılarda görsel indirilir ve Instagram profili açılır; web sitesi Instagram'a otomatik gönderi yayımlayamaz.
- WebM kaydı, `MediaRecorder` ve `canvas.captureStream()` destekleyen tarayıcılarda çalışır. Desteklenmeyen tarayıcılarda şeffaf PNG indirme kullanılabilir.
- Google yorum bağlantısı önceki demodaki Place ID ile bırakılmıştır; yayına almadan önce işletme tarafından doğrulanmalıdır.

## Marka ve sunum notu

Bu bir konsept çalışmasıdır; resmî Karaköy Güllüoğlu hizmeti veya sipariş entegrasyonu değildir. İllüstrasyon, markanın koyu yeşil ve altın görsel dünyasına uygun sunum amacıyla hazırlanmıştır. Yayın öncesi marka onayı alınmalıdır.

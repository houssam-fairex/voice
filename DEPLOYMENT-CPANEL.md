# 📘 دليل النشر التفصيلي على cPanel

هذا الدليل يشرح بالتفصيل كيفية نشر غرفة الصوتية على استضافة cPanel.

## 📋 المتطلبات الأساسية

قبل البدء، تأكد من توفر:
- ✅ حساب استضافة cPanel يدعم Node.js (الإصدار 14 أو أحدث)
- ✅ الوصول إلى cPanel
- ✅ شهادة SSL (مجانية من Let's Encrypt أو مدفوعة)
- ✅ نطاق أو نطاق فرعي

## 🔍 التحقق من دعم Node.js

### الخطوة 1: تسجيل الدخول إلى cPanel
1. انتقل إلى رابط cPanel الخاص بك (عادة: `yourdomain.com/cpanel`)
2. أدخل اسم المستخدم وكلمة المرور

### الخطوة 2: البحث عن Node.js
1. في صفحة cPanel الرئيسية، ابحث عن "Node.js" أو "Setup Node.js App"
2. إذا لم تجدها، ابحث عن "Software" ثم "Select PHP Version" - بعض الاستضافات تضعها هناك
3. إذا لم تجدها، اتصل بالدعم الفني وتأكد من دعم Node.js

## 📦 الطريقة 1: النشر عبر File Manager (الأسهل)

### الخطوة 1: تحضير الملفات
1. على جهازك، قم بضغط مجلد المشروع بالكامل إلى ملف ZIP
   - تأكد من تضمين جميع الملفات عدا مجلد `node_modules`

### الخطوة 2: رفع الملفات
1. في cPanel، افتح **File Manager**
2. انتقل إلى:
   - `public_html` (للنطاق الرئيسي)
   - أو `public_html/subdomain` (للنطاق الفرعي)
   - أو أنشئ مجلد جديد مثل `voice-chat`
3. انقر على **Upload**
4. اختر ملف ZIP وارفعه
5. بعد الرفع، انقر بزر الماوس الأيمن على الملف واختر **Extract**
6. احذف ملف ZIP بعد فك الضغط

### الخطوة 3: إعداد تطبيق Node.js
1. ارجع إلى cPanel الرئيسية
2. افتح **Setup Node.js App**
3. انقر على **Create Application**

### الخطوة 4: ملء بيانات التطبيق
املأ الحقول التالية:

```
Node.js version: 18.x (أو أحدث إصدار متاح)
Application mode: Production
Application root: voice-chat (أو المسار الذي رفعت فيه الملفات)
Application URL: yourdomain.com أو subdomain.yourdomain.com
Application startup file: server.js
```

### الخطوة 5: تعيين المنفذ
بعض استضافات cPanel تتطلب منفذ محدد:
1. في صفحة التطبيق، ابحث عن **Environment Variables**
2. أضف متغير جديد:
   - Name: `PORT`
   - Value: (المنفذ المخصص من الاستضافة، أو 3000)

### الخطوة 6: تثبيت الحزم
1. انقر على **Run NPM Install**
2. انتظر حتى تكتمل العملية (قد تستغرق بضع دقائق)

### الخطوة 7: تشغيل التطبيق
1. انقر على **Start App** أو **Restart App**
2. انتظر حتى يظهر حالة "Running"

### الخطوة 8: الاختبار
1. افتح المتصفح وانتقل إلى الرابط الذي اخترته
2. يجب أن تظهر صفحة الدخول

## 🔐 تفعيل HTTPS (مهم جداً!)

WebRTC يتطلب HTTPS للعمل بشكل صحيح في معظم المتصفحات.

### استخدام Let's Encrypt (مجاني)
1. في cPanel، افتح **SSL/TLS Status**
2. اختر النطاق الخاص بك
3. انقر على **Run AutoSSL**
4. انتظر حتى تُثبت الشهادة
5. تأكد من أن موقعك يعمل على `https://`

## 🚀 الطريقة 2: النشر عبر SSH (للمستخدمين المتقدمين)

إذا كان لديك وصول SSH:

### الخطوة 1: الاتصال بالخادم
```bash
ssh username@yourdomain.com
```

### الخطوة 2: الانتقال إلى المجلد المناسب
```bash
cd ~/public_html
# أو
cd ~/public_html/subdomain
```

### الخطوة 3: رفع الملفات
يمكنك استخدام Git:
```bash
git clone https://your-repository-url.git voice-chat
cd voice-chat
```

أو استخدام SCP من جهازك:
```bash
scp -r voice-chat-room username@yourdomain.com:~/public_html/
```

### الخطوة 4: تثبيت الحزم
```bash
cd voice-chat
npm install --production
```

### الخطوة 5: إعداد التطبيق
أكمل إعداد التطبيق من cPanel كما في الطريقة 1.

## 🔧 استكشاف الأخطاء الشائعة

### المشكلة 1: "Application failed to start"
**الأسباب المحتملة:**
- المنفذ مستخدم بالفعل
- خطأ في مسار `Application root`
- `server.js` غير موجود

**الحلول:**
1. تحقق من مسار التطبيق
2. تأكد من وجود `server.js` في المجلد الصحيح
3. تحقق من سجل الأخطاء في cPanel
4. جرب منفذ مختلف

### المشكلة 2: "Cannot GET /"
**الحل:**
1. تأكد من أن مجلد `public` موجود
2. تحقق من وجود `index.html` في `public`
3. أعد تشغيل التطبيق

### المشكلة 3: الصوت لا يعمل
**الحلول:**
1. تأكد من تفعيل HTTPS
2. تحقق من السماح بالوصول للميكروفون
3. افتح Console في المتصفح وابحث عن الأخطاء

### المشكلة 4: Socket.IO لا يتصل
**الحل:**
1. تحقق من أن التطبيق يعمل
2. تأكد من عدم حظر WebSocket من قبل Firewall
3. تحقق من إعدادات CORS

## ⚙️ إعدادات إضافية

### استخدام PM2 (للاستقرار)
إذا كان لديك وصول SSH:

```bash
# تثبيت PM2 عالمياً
npm install -g pm2

# تشغيل التطبيق
pm2 start server.js --name voice-chat

# جعل PM2 يعمل تلقائياً عند إعادة التشغيل
pm2 startup
pm2 save

# مراقبة التطبيق
pm2 status
pm2 logs voice-chat

# إعادة تشغيل التطبيق
pm2 restart voice-chat
```

### تحسين الأداء
في ملف `server.js`، يمكنك إضافة:

```javascript
// تفعيل ضغط الاستجابات
const compression = require('compression');
app.use(compression());

// تحديد عدد الاتصالات
io.set('transports', ['websocket', 'polling']);
```

لا تنسى تثبيت compression:
```bash
npm install compression
```

### مراقبة الموارد
راقب استخدام الموارد في cPanel:
1. افتح **Resource Usage**
2. راقب CPU و Memory
3. إذا كان الاستخدام مرتفع، قد تحتاج لترقية الاستضافة

## 📊 النطاقات الفرعية (Subdomains)

### إنشاء نطاق فرعي
1. في cPanel، افتح **Subdomains**
2. أدخل اسم النطاق الفرعي (مثل: `chat`)
3. سيصبح الرابط: `chat.yourdomain.com`
4. تأكد من المسار (Document Root)
5. أنشئ النطاق الفرعي
6. ارفع ملفات التطبيق في المجلد المخصص

## 🔄 التحديثات

### تحديث التطبيق
1. في File Manager، احذف الملفات القديمة (احتفظ بـ `node_modules`)
2. ارفع الملفات الجديدة
3. في **Setup Node.js App**، انقر **Restart**

### استخدام Git للتحديثات (SSH)
```bash
cd ~/public_html/voice-chat
git pull origin main
npm install
# ثم أعد تشغيل التطبيق من cPanel
```

## 📱 الاختبار النهائي

### قائمة التحقق:
- [ ] التطبيق يعمل على HTTPS
- [ ] يمكن الوصول إلى الصفحة الرئيسية
- [ ] الميكروفون يعمل (اختبر بجهازين)
- [ ] يمكن إنشاء غرفة جديدة
- [ ] يمكن الانضمام لغرفة موجودة
- [ ] الصوت يعمل بين المستخدمين
- [ ] زر كتم الصوت يعمل
- [ ] نسخ رابط الغرفة يعمل

## 💡 نصائح مهمة

### الأداء
- استخدم CDN للملفات الثابتة إذا كان لديك الكثير من المستخدمين
- فعّل Caching في `.htaccess`
- استخدم خادم TURN للمستخدمين خلف NAT صارم

### الأمان
- لا تشارك معلومات cPanel الخاصة بك
- استخدم كلمات مرور قوية
- فعّل Two-Factor Authentication في cPanel
- راقب سجلات الوصول بانتظام

### النسخ الاحتياطي
- اعمل نسخ احتياطي دوري من cPanel
- احتفظ بنسخة من الكود على GitHub أو GitLab

## 📞 الدعم

إذا واجهت مشاكل:

### دعم الاستضافة
- اتصل بالدعم الفني لاستضافتك
- اسألهم عن:
  - دعم Node.js والإصدار المتاح
  - المنفذ الموصى باستخدامه
  - إعدادات Firewall لـ WebSocket

### الموارد المفيدة
- [وثائق Socket.IO](https://socket.io/docs/)
- [وثائق WebRTC](https://webrtc.org/)
- [cPanel Docs - Node.js](https://docs.cpanel.net/cpanel/software/application-manager/)

---

**بالتوفيق في نشر تطبيقك! 🚀**

إذا احتجت لمساعدة إضافية، لا تتردد في طلب الدعم.


    # 🔧 حل مشاكل النشر على cPanel

## ❌ المشكلة: Socket.IO يعطي خطأ 404

### الأعراض:
```
socket.io.js:1 Failed to load resource: the server responded with a status of 404 (Not Found)
app.js:2 Uncaught ReferenceError: io is not defined
```

---

## ✅ الحلول خطوة بخطوة:

### الحل 1: التحقق من تشغيل تطبيق Node.js

1. **سجل دخول إلى cPanel**
2. **افتح "Setup Node.js App"**
3. **تحقق من حالة التطبيق:**
   - يجب أن تكون الحالة: **"Running"** 🟢
   - إذا كانت: **"Stopped"** 🔴 → انقر **"Start App"**

4. **إذا لم يعمل:**
   - انقر **"Restart"**
   - انتظر 30 ثانية
   - حدّث الصفحة

---

### الحل 2: التحقق من إعدادات التطبيق

افتح تطبيقك في **Setup Node.js App** وتحقق من:

#### ✅ الإعدادات الصحيحة:

| الإعداد | القيمة الصحيحة |
|---------|----------------|
| **Node.js version** | 14.x أو أحدث |
| **Application mode** | Production |
| **Application root** | المسار الصحيح لمجلد المشروع |
| **Application URL** | النطاق أو النطاق الفرعي |
| **Application startup file** | `server.js` |

#### ⚠️ أخطاء شائعة:
- ❌ Application root خاطئ (مثلاً: `/public_html` بدلاً من `/public_html/voice-chat-room`)
- ❌ Application startup file خاطئ (مثلاً: `index.js` بدلاً من `server.js`)

---

### الحل 3: التحقق من تثبيت الحزم

1. في **Setup Node.js App**، ابحث عن زر **"Run NPM Install"**
2. انقر عليه وانتظر حتى ينتهي
3. تحقق من وجود مجلد `node_modules` في File Manager
4. يجب أن يحتوي على مجلدات `express` و `socket.io`

---

### الحل 4: التحقق من ملف package.json

تأكد من وجود ملف `package.json` في المجلد الصحيح:

```json
{
  "name": "voice-chat-room",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1"
  }
}
```

**تحقق من:**
- ✅ الملف موجود في نفس المجلد مع `server.js`
- ✅ لا يوجد أخطاء في صيغة JSON

---

### الحل 5: مشكلة المنفذ (Port)

بعض استضافات cPanel تتطلب استخدام منفذ معين.

#### الطريقة الأولى: استخدام متغير PORT

في **Setup Node.js App**:
1. انتقل إلى **"Environment Variables"**
2. أضف متغير جديد:
   - **Name:** `PORT`
   - **Value:** (المنفذ من الاستضافة، أو حاول: `3000`, `8080`, `8000`)

#### الطريقة الثانية: تعديل server.js

إذا لم تعمل المتغيرات، عدّل `server.js`:

```javascript
// قبل التعديل
const PORT = process.env.PORT || 3000;

// بعد التعديل - جرّب منافذ مختلفة
const PORT = process.env.PORT || 3001;
// أو
const PORT = 3000;
```

---

### الحل 6: مشكلة المسار (Path)

#### تحقق من هيكل الملفات:

يجب أن يكون كالتالي:
```
/home/username/public_html/voice-chat-room/
├── server.js
├── package.json
├── node_modules/
└── public/
    ├── index.html
    ├── style.css
    └── app.js
```

#### ⚠️ أخطاء شائعة:
- ❌ الملفات في مجلد فرعي إضافي
- ❌ الملفات مباشرة في `public_html` بدون مجلد منفصل
- ❌ مجلد `public` مفقود أو اسمه خاطئ

---

### الحل 7: إعدادات .htaccess

أنشئ أو عدّل ملف `.htaccess` في مجلد المشروع:

```apache
# إعادة توجيه إلى HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# السماح بـ WebSocket
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type"
</IfModule>

# عدم التداخل مع Node.js
<IfModule mod_rewrite.c>
    RewriteEngine On
    # لا تعيد كتابة طلبات Socket.IO
    RewriteCond %{REQUEST_URI} !^/socket.io
    # اسمح للـ Node.js بمعالجة الطلبات
    RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
</IfModule>
```

---

### الحل 8: التحقق من السجلات (Logs)

في **Setup Node.js App**:
1. ابحث عن **"Log"** أو **"Application Log"**
2. افتحه واقرأ الأخطاء
3. ابحث عن:
   - `Error: Cannot find module 'express'` → احتاج لتشغيل npm install
   - `Error: listen EADDRINUSE` → المنفذ مستخدم
   - `Error: ENOENT` → مسار خاطئ

**نسخ الأخطاء ومشاركتها تساعد في تحديد المشكلة بدقة**

---

### الحل 9: إعادة النشر من الصفر

إذا لم يعمل أي شيء، ابدأ من جديد:

#### الخطوة 1: حذف التطبيق القديم
1. في **Setup Node.js App**، احذف التطبيق
2. في **File Manager**، احذف مجلد المشروع

#### الخطوة 2: رفع الملفات من جديد
1. ضغط المشروع على جهازك (بدون `node_modules`)
2. رفعه إلى cPanel
3. فك الضغط

#### الخطوة 3: إنشاء التطبيق
1. افتح **Setup Node.js App**
2. **Create Application**
3. املأ البيانات بدقة:
   ```
   Node.js version: 18.x
   Application mode: Production
   Application root: /home/username/public_html/voice-chat-room
   Application URL: yourdomain.com أو subdomain.yourdomain.com
   Application startup file: server.js
   ```

#### الخطوة 4: تثبيت الحزم
1. انقر **"Run NPM Install"**
2. انتظر (قد يأخذ 2-5 دقائق)

#### الخطوة 5: تشغيل التطبيق
1. انقر **"Start App"**
2. انتظر حتى تصبح الحالة "Running"

#### الخطوة 6: اختبار
- افتح `https://yourdomain.com`
- افتح Console (F12) وتحقق من عدم وجود أخطاء

---

## 🔍 طرق اختبار إضافية:

### اختبار 1: تحقق من الوصول للخادم

افتح في المتصفح:
```
https://yourdomain.com
```

يجب أن ترى:
- ✅ صفحة الدخول تظهر بشكل صحيح
- ✅ لا توجد أخطاء في Console

### اختبار 2: تحقق من Socket.IO

افتح في المتصفح:
```
https://yourdomain.com/socket.io/socket.io.js
```

يجب أن:
- ✅ يُحمّل ملف JavaScript
- ❌ لا يعطي 404

### اختبار 3: استخدام SSH (إذا متاح)

```bash
# الاتصال
ssh username@yourdomain.com

# الانتقال للمشروع
cd ~/public_html/voice-chat-room

# التحقق من الملفات
ls -la

# التحقق من node_modules
ls node_modules/

# تشغيل الخادم يدوياً للاختبار
node server.js

# يجب أن ترى: "الخادم يعمل على المنفذ 3000"
```

---

## 📞 أسئلة مهمة للاستضافة:

إذا لم يعمل أي شيء، اسأل الدعم الفني:

1. **هل تدعمون Node.js؟ وما هي الإصدارات المتاحة؟**
2. **ما هو المنفذ الموصى به لتطبيقات Node.js؟**
3. **هل WebSocket مدعوم ومفعّل؟**
4. **هل هناك Firewall يحجب Socket.IO؟**
5. **هل يمكنني الوصول عبر SSH؟**

---

## 🎯 حل سريع مؤقت (للاختبار فقط)

إذا كنت تريد اختبار سريع، يمكنك استخدام خدمة مجانية مثل:

- **Render.com** (مجاني)
- **Railway.app** (مجاني مع حد معقول)
- **Glitch.com** (مجاني)
- **Heroku** (كان مجاني سابقاً)

هذه تدعم Node.js بشكل مباشر وسهل.

---

## 📋 قائمة تحقق نهائية:

قبل طلب الدعم، تحقق من:

- [ ] التطبيق في "Running" state
- [ ] npm install تم بنجاح
- [ ] server.js موجود في المكان الصحيح
- [ ] package.json صحيح وفي المكان الصحيح
- [ ] مجلد public موجود ويحتوي على index.html
- [ ] node_modules موجود ويحتوي على express و socket.io
- [ ] Application root صحيح 100%
- [ ] Application startup file هو server.js
- [ ] HTTPS مفعّل (SSL)
- [ ] لا توجد أخطاء في Logs

---

## 💡 نصيحة أخيرة:

**بعض استضافات cPanel الرخيصة لا تدعم Node.js بشكل جيد**

إذا جربت كل شيء ولم يعمل:
1. تأكد من أن الاستضافة تدعم Node.js فعلياً (ليس فقط في الإعلانات)
2. فكّر في الترقية لـ VPS إذا كنت جاد في المشروع
3. أو استخدم خدمة سحابية متخصصة في Node.js

---

**هل تحتاج مساعدة في نقطة معينة؟ شارك معي:**
- 📷 لقطة شاشة من إعدادات Node.js App
- 📝 الأخطاء من Log
- 🔗 رابط الموقع (إذا أمكن)

وسأساعدك في الحل! 🚀


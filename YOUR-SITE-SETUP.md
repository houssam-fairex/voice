# 🎯 إعداد خاص بموقعك: hshestate.au

---

## 📍 المشكلة الحالية:
```
https://hshestate.au/table/test → 404 Not Found
```

---

## ✅ الحل المباشر:

### الخطوة 1: تحديد موقع الملفات الصحيح

**في cPanel → File Manager:**

أين رفعت الملفات؟ اختر واحدة:

#### الخيار A: الملفات في `/table/voice-chat-room/`
```
المسار الكامل:
/home/hshestat/public_html/table/voice-chat-room/server.js
```
✅ استخدم هذا المسار في Setup Node.js App

#### الخيار B: الملفات في `/table/` فقط
```
المسار الكامل:
/home/hshestat/public_html/table/server.js
```
✅ استخدم هذا المسار في Setup Node.js App

---

### الخطوة 2: إعداد التطبيق في cPanel

**افتح: Setup Node.js App → Create Application**

#### إذا اخترت الخيار A:
```
Node.js version: 18.x

Application mode: Production

Application root: /home/hshestat/public_html/table/voice-chat-room

Application URL: hshestate.au

Application startup file: server.js
```

#### إذا اخترت الخيار B:
```
Node.js version: 18.x

Application mode: Production

Application root: /home/hshestat/public_html/table

Application URL: hshestate.au

Application startup file: server.js
```

**ملاحظة مهمة:** 
- Application URL: `hshestate.au` (بدون /table)
- cPanel سيُعد التوجيه تلقائياً

---

### الخطوة 3: تثبيت وتشغيل

1. **Run NPM Install** ← انقر وانتظر
2. **Start App** ← شغّل التطبيق
3. تأكد من الحالة: 🟢 **Running**

---

### الخطوة 4: اختبار

**جرّب هذه الروابط:**

```
✅ https://hshestate.au/test
✅ https://hshestate.au/api/status
✅ https://hshestate.au
```

**لا تستخدم `/table` في الرابط!**

---

## 🔍 لماذا لا أستخدم /table؟

عندما تضع `Application URL: hshestate.au`:
- cPanel يُعد التوجيه من النطاق الرئيسي
- التطبيق يصبح متاح على `https://hshestate.au`
- وليس `https://hshestate.au/table`

---

## 🛠️ إذا أردت استخدام `/table` في الرابط

يجب تعديل إعدادات إضافية:

### الحل 1: استخدام نطاق فرعي (Subdomain)

1. **في cPanel → Subdomains**
2. **أنشئ:** `voice.hshestate.au` أو `chat.hshestate.au`
3. **في Setup Node.js App:**
   ```
   Application URL: voice.hshestate.au
   ```
4. **الوصول:**
   ```
   https://voice.hshestate.au
   https://voice.hshestate.au/test
   ```

### الحل 2: تعديل ملف .htaccess

في `/public_html/`:
```apache
RewriteEngine On
RewriteRule ^table/(.*)$ http://localhost:3000/$1 [P,L]
```

لكن **الحل 1 أسهل وأفضل!**

---

## 📋 التعليمات النهائية لموقعك:

### ✅ الطريقة الموصى بها:

```
1. ضع الملفات في:
   /home/hshestat/public_html/voice-chat/

2. في Setup Node.js App:
   Application root: /home/hshestat/public_html/voice-chat
   Application URL: hshestate.au
   
3. Run NPM Install
   
4. Start App

5. افتح: https://hshestate.au
```

---

## 🎯 قائمة تحقق سريعة:

- [ ] فتحت cPanel
- [ ] فتحت File Manager
- [ ] حددت مكان الملفات الدقيق
- [ ] نسخت المسار الكامل
- [ ] فتحت Setup Node.js App
- [ ] أنشأت تطبيق جديد (أو عدّلت القديم)
- [ ] Application root = المسار الدقيق للملفات
- [ ] Application URL = hshestate.au (بدون /table)
- [ ] Application startup file = server.js
- [ ] ضغطت Run NPM Install
- [ ] انتظرت حتى انتهى
- [ ] ضغطت Start App
- [ ] الحالة: Running
- [ ] فتحت https://hshestate.au/test
- [ ] رأيت ✅ أخضر

---

## 🆘 إذا ما زال لا يعمل:

### تحقق من هذه النقاط:

1. **اسم المستخدم صحيح؟**
   - افتح File Manager
   - انظر للمسار: `/home/USERNAME/`
   - استخدم نفس USERNAME في Application root

2. **server.js موجود في المسار؟**
   - في File Manager
   - اذهب للمسار المحدد في Application root
   - يجب أن ترى server.js هناك مباشرة

3. **node_modules موجود؟**
   - إذا لا → Run NPM Install لم يعمل بشكل صحيح
   - جرب مرة أخرى

4. **Application Log ماذا يقول؟**
   - في Setup Node.js App
   - افتح Log
   - انسخ آخر الأسطر وشاركها معي

---

## 📞 للدعم المباشر:

شاركني:
1. لقطة شاشة من File Manager (تظهر مكان الملفات)
2. لقطة شاشة من Setup Node.js App (الإعدادات)
3. محتوى Application Log (إن وجد)

**وسأحل المشكلة مباشرة! 🚀**

---

## 🎁 بونص: أوامر SSH (إذا متاح)

إذا كان لديك وصول SSH:

```bash
# الاتصال
ssh hshestat@hshestate.au

# الذهاب للمشروع
cd ~/public_html/table/voice-chat-room

# أو
cd ~/public_html/table

# التحقق من الملفات
ls -la

# يجب أن ترى:
# server.js
# package.json
# public/

# تثبيت الحزم
npm install

# تشغيل للاختبار
node server.js

# يجب أن ترى:
# ✅ الخادم يعمل بنجاح!
# 📡 المنفذ: 3000
```

إذا عمل من SSH → المشكلة في إعدادات cPanel فقط

---

**جرّب الآن وأخبرني! 💪**


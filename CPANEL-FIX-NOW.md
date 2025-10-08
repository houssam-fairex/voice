# 🚨 حل مشكلة 404 - خطوات فورية

## المشكلة:
عند فتح `https://hshestate.au/table/test` → 404 Not Found

---

## ✅ الحل (خطوة بخطوة):

### 🔍 الخطوة 1: تحقق من تشغيل التطبيق

1. **سجل دخول cPanel:**
   - اذهب إلى: `https://hshestate.au:2083` (أو الرابط الخاص بـ cPanel)

2. **افتح "Setup Node.js App"**
   - ابحث عنها في cPanel

3. **تحقق من الحالة:**
   - هل توجد تطبيق؟
     - ✅ **نعم** → انظر للحالة
     - ❌ **لا** → انتقل للخطوة 3

4. **الحالة:**
   - 🟢 **Running** → انتقل للخطوة 2
   - 🔴 **Stopped** → اضغط "Start App"
   - ⚠️ **لا يوجد تطبيق** → انتقل للخطوة 3

---

### 🔧 الخطوة 2: تصحيح المسار

المشكلة: المشروع في مجلد `/table/` لكن الإعدادات غير صحيحة.

**في Setup Node.js App → إعدادات التطبيق:**

#### ✅ الإعدادات الصحيحة:

```
Application root: /home/hshestat/public_html/table
                  ^^^^^^^^^ غيّر هذا لاسم مستخدمك الفعلي

Application URL: hshestate.au/table
                 أو
Application URL: hshestate.au
                 (إذا تريد الوصول مباشرة بدون /table)

Application startup file: server.js
```

#### كيف تعرف اسم المستخدم الصحيح؟
1. افتح **File Manager** في cPanel
2. انظر للمسار في الأعلى
3. سيكون شبيه بـ: `/home/USERNAME/`

#### مثال:
```
المسار الكامل للمشروع:
/home/hshestat/public_html/table/voice-chat-room/

إذاً:
Application root: /home/hshestat/public_html/table/voice-chat-room
```

---

### 📁 الخطوة 3: تحقق من موقع الملفات

1. **افتح File Manager**

2. **اذهب إلى:**
   ```
   public_html/table/
   ```

3. **تحقق من الملفات:**
   - [ ] هل `server.js` موجود؟
   - [ ] هل `package.json` موجود؟
   - [ ] هل مجلد `public` موجود؟
   - [ ] هل مجلد `node_modules` موجود؟

4. **إذا الملفات مفقودة:**
   - ارفع المشروع من جديد
   - تأكد من فك ضغط الـ ZIP

---

### 🎯 الخطوة 4: إنشاء/تحديث التطبيق

#### إذا لم يكن هناك تطبيق، أنشئ واحد:

1. **في Setup Node.js App → Create Application**

2. **املأ البيانات:**
   ```
   Node.js version: 18.x (أو أحدث)
   
   Application mode: Production
   
   Application root: /home/hshestat/public_html/table/voice-chat-room
                     ^^^^^^^^^ اسم المستخدم الفعلي
   
   Application URL: hshestate.au (أو hshestate.au/table)
   
   Application startup file: server.js
   ```

3. **اضغط Create**

---

### 📦 الخطوة 5: تثبيت الحزم

1. **في Setup Node.js App:**
   - اضغط "Run NPM Install"
   - انتظر حتى ينتهي (قد يأخذ 2-5 دقائق)

2. **تحقق من التثبيت:**
   - افتح File Manager
   - تأكد من وجود مجلد `node_modules`

---

### ▶️ الخطوة 6: تشغيل التطبيق

1. **في Setup Node.js App:**
   - اضغط "Start App"
   - انتظر 10 ثوانٍ

2. **تحقق من الحالة:**
   - يجب أن تكون: 🟢 **Running**

---

### 🧪 الخطوة 7: اختبار

**جرّب هذه الروابط بالترتيب:**

#### أ) اختبار أساسي:
```
https://hshestate.au/table
```
يجب أن ترى: صفحة الدخول للغرفة الصوتية

#### ب) اختبار الخادم:
```
https://hshestate.au/table/test
```
يجب أن ترى:
- ✅ Express يعمل
- ✅ Socket.IO يعمل

#### ج) اختبار API:
```
https://hshestate.au/table/api/status
```
يجب أن ترى: بيانات JSON عن الخادم

---

## 🔍 استكشاف الأخطاء

### ❌ لا يزال 404؟

#### الاحتمال 1: Application URL خاطئ
**الحل:**
- في Setup Node.js App
- غيّر Application URL إلى:
  ```
  hshestate.au
  ```
  (بدون /table)

#### الاحتمال 2: ملف .htaccess يسبب مشكلة
**الحل:**
1. في File Manager، اذهب لـ `public_html/table/`
2. ابحث عن `.htaccess`
3. أعد تسميته مؤقتاً إلى `.htaccess.backup`
4. جرّب مرة أخرى

#### الاحتمال 3: المشروع في مجلد خاطئ
**الحل:**
1. في File Manager، ابحث عن مجلد المشروع
2. تأكد أنه في المكان الصحيح
3. المسار الصحيح يجب أن يكون:
   ```
   /home/USERNAME/public_html/table/voice-chat-room/
   أو
   /home/USERNAME/public_html/table/
   ```

#### الاحتمال 4: Application root يشير لمجلد خاطئ

**تحقق بدقة:**

إذا كانت الملفات في:
```
/home/hshestat/public_html/table/voice-chat-room/server.js
```

فـ Application root يجب أن يكون:
```
/home/hshestat/public_html/table/voice-chat-room
```

وليس:
```
/home/hshestat/public_html/table  ❌ خاطئ
/home/hshestat/public_html        ❌ خاطئ
```

---

## 📊 السيناريوهات الشائعة

### السيناريو A: المشروع في `table/voice-chat-room/`

```
الملفات:
/home/USER/public_html/table/voice-chat-room/server.js

الإعدادات:
Application root: /home/USER/public_html/table/voice-chat-room
Application URL: hshestate.au/table

الوصول:
https://hshestate.au/table
https://hshestate.au/table/test
```

### السيناريو B: المشروع مباشرة في `table/`

```
الملفات:
/home/USER/public_html/table/server.js

الإعدادات:
Application root: /home/USER/public_html/table
Application URL: hshestate.au/table

الوصول:
https://hshestate.au/table
https://hshestate.au/table/test
```

### السيناريو C: المشروع في `public_html` مباشرة

```
الملفات:
/home/USER/public_html/server.js

الإعدادات:
Application root: /home/USER/public_html
Application URL: hshestate.au

الوصول:
https://hshestate.au
https://hshestate.au/test
```

---

## 🎯 الحل السريع (جرّب هذا أولاً):

### 1. احذف التطبيق القديم
في Setup Node.js App → Delete

### 2. أنشئ تطبيق جديد
```
Application root: /home/hshestat/public_html/table/voice-chat-room
                  ^^^^^^^^^ غيّر hshestat لاسم مستخدمك الحقيقي

Application URL: hshestate.au

Application startup file: server.js
```

### 3. Run NPM Install
اضغط على الزر وانتظر

### 4. Start App
شغّل التطبيق

### 5. اختبر
افتح: `https://hshestate.au/test`

---

## 📸 شارك معي

إذا لم يعمل، أرسل لقطات شاشة لـ:

1. **Setup Node.js App** (صفحة التطبيق بالكامل)
2. **File Manager** (مسار المشروع)
3. **Application Log** (إن وجد)

وسأساعدك مباشرة! 🚀

---

## 💡 نصيحة مهمة

**المشكلة الأساسية غالباً:**
- ❌ Application root خاطئ
- ❌ الملفات في مكان آخر
- ❌ التطبيق غير مشغّل

**الحل:**
- ✅ تأكد من المسار الدقيق للملفات
- ✅ استخدم نفس المسار في Application root
- ✅ شغّل التطبيق

---

**جرّب الآن واخبرني بالنتيجة! 💪**


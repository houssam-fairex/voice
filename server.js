const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
});
const path = require('path');

// تحديد المنفذ - يمكن تغييره حسب إعدادات cPanel
const PORT = process.env.PORT || 3000;

// تسجيل معلومات البداية
console.log('🚀 جاري تشغيل الخادم...');
console.log('📁 المجلد الحالي:', __dirname);
console.log('🔧 البيئة:', process.env.NODE_ENV || 'development');

// خدمة الملفات الثابتة
app.use(express.static('public'));

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// صفحة الاختبار (للتحقق من عمل الخادم)
app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

// API للتحقق من حالة الخادم
app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        activeRooms: rooms.size,
        activeUsers: users.size,
        nodeVersion: process.version,
        platform: process.platform
    });
});

// تخزين المستخدمين المتصلين
const users = new Map();
const rooms = new Map();

io.on('connection', (socket) => {
    console.log('مستخدم جديد متصل:', socket.id);

    // الانضمام إلى الغرفة
    socket.on('join-room', (roomId, username) => {
        console.log(`${username} ينضم إلى الغرفة ${roomId}`);
        
        // إضافة المستخدم إلى الغرفة
        socket.join(roomId);
        
        // حفظ معلومات المستخدم
        users.set(socket.id, { username, roomId });
        
        // تحديث قائمة المستخدمين في الغرفة
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(socket.id);
        
        // إخبار المستخدمين الآخرين في الغرفة
        socket.to(roomId).emit('user-connected', {
            userId: socket.id,
            username: username
        });
        
        // إرسال قائمة المستخدمين الحاليين للمستخدم الجديد
        const roomUsers = Array.from(rooms.get(roomId))
            .filter(id => id !== socket.id)
            .map(id => ({
                userId: id,
                username: users.get(id)?.username || 'مجهول'
            }));
        
        socket.emit('existing-users', roomUsers);
        
        // إرسال تحديث عدد المستخدمين
        updateUserCount(roomId);
    });

    // إشارات WebRTC
    socket.on('offer', (data) => {
        socket.to(data.target).emit('offer', {
            offer: data.offer,
            sender: socket.id,
            username: users.get(socket.id)?.username
        });
    });

    socket.on('answer', (data) => {
        socket.to(data.target).emit('answer', {
            answer: data.answer,
            sender: socket.id
        });
    });

    socket.on('ice-candidate', (data) => {
        socket.to(data.target).emit('ice-candidate', {
            candidate: data.candidate,
            sender: socket.id
        });
    });

    // كتم/إلغاء كتم الصوت
    socket.on('toggle-mute', (isMuted) => {
        const user = users.get(socket.id);
        if (user) {
            socket.to(user.roomId).emit('user-muted', {
                userId: socket.id,
                isMuted: isMuted
            });
        }
    });

    // قطع الاتصال
    socket.on('disconnect', () => {
        console.log('مستخدم قطع الاتصال:', socket.id);
        
        const user = users.get(socket.id);
        if (user) {
            const { roomId, username } = user;
            
            // إزالة المستخدم من الغرفة
            if (rooms.has(roomId)) {
                rooms.get(roomId).delete(socket.id);
                
                // حذف الغرفة إذا كانت فارغة
                if (rooms.get(roomId).size === 0) {
                    rooms.delete(roomId);
                } else {
                    // إخبار المستخدمين الآخرين
                    socket.to(roomId).emit('user-disconnected', {
                        userId: socket.id,
                        username: username
                    });
                    
                    updateUserCount(roomId);
                }
            }
            
            users.delete(socket.id);
        }
    });

    // تحديث عدد المستخدمين في الغرفة
    function updateUserCount(roomId) {
        const count = rooms.get(roomId)?.size || 0;
        io.to(roomId).emit('user-count', count);
    }
});

// معالجة الأخطاء غير المتوقعة
process.on('uncaughtException', (error) => {
    console.error('❌ خطأ غير متوقع:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ وعد مرفوض:', error);
});

// تشغيل الخادم
const server = http.listen(PORT, () => {
    console.log('✅ الخادم يعمل بنجاح!');
    console.log(`📡 المنفذ: ${PORT}`);
    console.log(`🌐 الرابط المحلي: http://localhost:${PORT}`);
    console.log('⏰ الوقت:', new Date().toLocaleString('ar-SA'));
    console.log('👂 في انتظار الاتصالات...\n');
});

// معالجة إغلاق الخادم بشكل صحيح
process.on('SIGTERM', () => {
    console.log('🛑 إيقاف الخادم...');
    server.close(() => {
        console.log('✅ تم إيقاف الخادم بنجاح');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n🛑 إيقاف الخادم...');
    server.close(() => {
        console.log('✅ تم إيقاف الخادم بنجاح');
        process.exit(0);
    });
});


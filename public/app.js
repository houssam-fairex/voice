// الاتصال بالخادم
const socket = io();

// عناصر DOM
const loginScreen = document.getElementById('login-screen');
const roomScreen = document.getElementById('room-screen');
const usernameInput = document.getElementById('username');
const roomIdInput = document.getElementById('room-id');
const joinBtn = document.getElementById('join-btn');
const leaveBtn = document.getElementById('leave-btn');
const muteBtn = document.getElementById('mute-btn');
const videoBtn = document.getElementById('video-btn');
const copyLinkBtn = document.getElementById('copy-link-btn');
const testNetworkBtn = document.getElementById('test-network-btn');
const usersList = document.getElementById('users-list');
const currentRoomIdSpan = document.getElementById('current-room-id');
const userCountSpan = document.getElementById('user-count');
const connectionStatus = document.getElementById('connection-status');
const statusText = document.getElementById('status-text');

// متغيرات الحالة
let localStream = null;
let peers = new Map(); // Map of userId -> RTCPeerConnection
let isMuted = false;
let isVideoOff = false;
let currentRoomId = null;
let currentUsername = null;

// إعدادات WebRTC محسنة لجميع المتصفحات مع خوادم TURN
const configuration = {
    iceServers: [
        // خوادم STUN الأساسية
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        
        // خوادم STUN إضافية للتوافق
        { urls: 'stun:stun.stunprotocol.org:3478' },
        { urls: 'stun:stun.ekiga.net' },
        { urls: 'stun:stun.fwdnet.net' },
        { urls: 'stun:stun.ideasip.com' },
        { urls: 'stun:stun.iptel.org' },
        { urls: 'stun:stun.rixtelecom.se' },
        { urls: 'stun:stun.schlund.de' },
        { urls: 'stun:stunserver.org' },
        { urls: 'stun:stun.softjoys.com' },
        { urls: 'stun:stun.voiparound.com' },
        { urls: 'stun:stun.voipbuster.com' },
        { urls: 'stun:stun.voipstunt.com' },
        { urls: 'stun:stun.voxgratia.org' },
        { urls: 'stun:stun.xten.com' },
        
        // خوادم TURN مجانية موثوقة للاتصال عبر الشبكات المختلفة
        { 
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        { 
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        { 
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        
        // خوادم TURN إضافية مجانية
        { 
            urls: 'turn:freeturn.tel:3478',
            username: 'free',
            credential: 'free'
        },
        { 
            urls: 'turn:freeturn.tel:3478?transport=tcp',
            username: 'free',
            credential: 'free'
        },
        
        // خوادم TURN أخرى موثوقة
        { 
            urls: 'turn:relay.metered.ca:80',
            username: '87e9c5b0b0b0b0b0',
            credential: '5b0b0b0b0b0b0b0b'
        },
        { 
            urls: 'turn:relay.metered.ca:443',
            username: '87e9c5b0b0b0b0b0',
            credential: '5b0b0b0b0b0b0b0b'
        },
        { 
            urls: 'turn:relay.metered.ca:443?transport=tcp',
            username: '87e9c5b0b0b0b0b0',
            credential: '5b0b0b0b0b0b0b0b'
        },
        
        // خوادم TURN إضافية للتوافق الأقصى
        { 
            urls: 'turn:turn.bistri.com:80',
            username: 'homeo',
            credential: 'homeo'
        },
        { 
            urls: 'turn:turn.bistri.com:443',
            username: 'homeo',
            credential: 'homeo'
        },
        { 
            urls: 'turn:turn.bistri.com:443?transport=tcp',
            username: 'homeo',
            credential: 'homeo'
        },
        
        // خوادم TURN عامة أخرى
        { 
            urls: 'turn:webrtc.free-solutions.org:3478',
            username: 'free',
            credential: 'free'
        },
        { 
            urls: 'turn:webrtc.free-solutions.org:3478?transport=tcp',
            username: 'free',
            credential: 'free'
        },
        
        // خوادم TURN من خدمات مختلفة
        { 
            urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
            username: 'webrtc',
            credential: 'webrtc'
        },
        { 
            urls: 'turn:turn.anyfirewall.com:443',
            username: 'webrtc',
            credential: 'webrtc'
        }
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceTransportPolicy: 'all' // استخدام STUN و TURN
};

// الانضمام إلى الغرفة
joinBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const roomId = roomIdInput.value.trim() || generateRoomId();

    if (!username) {
        alert('Please enter your name!');
        return;
    }

    currentUsername = username;
    currentRoomId = roomId;

    try {
        // تحسين دعم الأجهزة المختلفة - محاولة الوصول للصوت أولاً ثم الكاميرا
        console.log('🔍 فحص دعم الأجهزة...');
        
        // فحص دعم WebRTC
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('WebRTC غير مدعوم في هذا المتصفح');
        }

        // محاولة الوصول للصوت أولاً
        let audioStream = null;
        let videoStream = null;
        
        try {
            console.log('🎤 محاولة الوصول للميكروفون...');
            
            // محاولة الطريقة الحديثة أولاً
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                audioStream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: 44100
                    }
                });
            } else {
                // استخدام الطريقة القديمة للمتصفحات القديمة
                audioStream = await getUserMediaLegacy({ audio: true });
            }
            
            console.log('✅ تم الوصول للميكروفون بنجاح');
        } catch (audioError) {
            console.warn('⚠️ فشل الوصول للميكروفون:', audioError);
            // محاولة الوصول للصوت بدون إعدادات متقدمة
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                } else {
                    audioStream = await getUserMediaLegacy({ audio: true });
                }
                console.log('✅ تم الوصول للميكروفون بإعدادات أساسية');
            } catch (basicAudioError) {
                console.error('❌ فشل الوصول للميكروفون تماماً:', basicAudioError);
                throw new Error('لا يمكن الوصول للميكروفون. تأكد من السماح بالوصول في إعدادات المتصفح.');
            }
        }

        // محاولة الوصول للكاميرا
        try {
            console.log('📹 محاولة الوصول للكاميرا...');
            
            // قائمة بترتيب أولويات الكاميرا
            const videoConstraints = [
                // محاولة كاميرا عالية الجودة أولاً
                {
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    facingMode: 'user',
                    frameRate: { ideal: 30, max: 60 }
                },
                // محاولة كاميرا متوسطة الجودة
                {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user',
                    frameRate: { ideal: 24 }
                },
                // محاولة كاميرا أساسية
                {
                    width: { ideal: 320 },
                    height: { ideal: 240 },
                    facingMode: 'user'
                },
                // محاولة أي كاميرا متاحة
                { video: true }
            ];

            for (let i = 0; i < videoConstraints.length; i++) {
                try {
                    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                        videoStream = await navigator.mediaDevices.getUserMedia({ 
                            video: videoConstraints[i]
                        });
                    } else {
                        videoStream = await getUserMediaLegacy({ video: videoConstraints[i] });
                    }
                    console.log(`✅ تم الوصول للكاميرا بإعدادات المستوى ${i + 1}`);
                    break;
                } catch (videoError) {
                    console.warn(`⚠️ فشل الوصول للكاميرا بالمستوى ${i + 1}:`, videoError);
                    if (i === videoConstraints.length - 1) {
                        throw videoError;
                    }
                }
            }
        } catch (videoError) {
            console.warn('⚠️ فشل الوصول للكاميرا:', videoError);
            // المتابعة بدون كاميرا إذا كان الصوت متاح
            if (audioStream) {
                console.log('ℹ️ المتابعة بالميكروفون فقط');
                videoStream = null;
            } else {
                throw new Error('لا يمكن الوصول للميكروفون أو الكاميرا. تأكد من السماح بالوصول في إعدادات المتصفح.');
            }
        }

        // دمج المسارات المتاحة
        if (audioStream && videoStream) {
            // دمج الصوت والفيديو
            localStream = new MediaStream([
                ...audioStream.getAudioTracks(),
                ...videoStream.getVideoTracks()
            ]);
            console.log('✅ تم دمج الصوت والفيديو بنجاح');
        } else if (audioStream) {
            // الصوت فقط
            localStream = audioStream;
            console.log('✅ تم استخدام الصوت فقط');
        } else if (videoStream) {
            // الفيديو فقط
            localStream = videoStream;
            console.log('✅ تم استخدام الفيديو فقط');
        } else {
            throw new Error('لا يمكن الوصول لأي جهاز صوتي أو مرئي');
        }

        // الانضمام إلى الغرفة
        socket.emit('join-room', roomId, username);

        // تحديث الواجهة
        currentRoomIdSpan.textContent = roomId;
        loginScreen.classList.remove('active');
        roomScreen.classList.add('active');

        updateStatus('connected', 'Connected');

        // Display local video
        displayLocalVideo();

        // Add current user to the list
        addUserToList('me', username + ' (You)', false, true);

    } catch (error) {
        console.error('❌ خطأ في الوصول للأجهزة:', error);
        
        // رسائل خطأ مفصلة حسب نوع المشكلة
        let errorMessage = '';
        
        if (error.name === 'NotAllowedError') {
            errorMessage = 'تم رفض الوصول للميكروفون/الكاميرا.\n\nيرجى:\n1. السماح بالوصول في إعدادات المتصفح\n2. إعادة تحميل الصفحة\n3. التأكد من عدم حظر الموقع';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'لم يتم العثور على ميكروفون أو كاميرا.\n\nيرجى:\n1. التأكد من توصيل الميكروفون/الكاميرا\n2. التحقق من إعدادات النظام\n3. تجربة متصفح آخر';
        } else if (error.name === 'NotReadableError') {
            errorMessage = 'الميكروفون/الكاميرا قيد الاستخدام من قبل تطبيق آخر.\n\nيرجى:\n1. إغلاق التطبيقات الأخرى\n2. إعادة تشغيل المتصفح\n3. التحقق من إعدادات النظام';
        } else if (error.name === 'OverconstrainedError') {
            errorMessage = 'إعدادات الكاميرا غير مدعومة.\n\nيرجى:\n1. تجربة متصفح آخر\n2. تحديث المتصفح\n3. التحقق من إعدادات الكاميرا';
        } else if (error.name === 'SecurityError') {
            errorMessage = 'خطأ أمني - يجب استخدام HTTPS.\n\nيرجى:\n1. التأكد من أن الموقع يستخدم HTTPS\n2. تجربة متصفح آخر\n3. التحقق من إعدادات الأمان';
        } else {
            errorMessage = `خطأ غير متوقع: ${error.message}\n\nيرجى:\n1. إعادة تحميل الصفحة\n2. تجربة متصفح آخر\n3. التحقق من إعدادات المتصفح`;
        }
        
        alert(`❌ فشل في الوصول للأجهزة\n\n${errorMessage}`);
        
        // إظهار معلومات إضافية في وحدة التحكم للمطورين
        console.log('🔧 معلومات إضافية للمطورين:');
        console.log('- نوع الخطأ:', error.name);
        console.log('- رسالة الخطأ:', error.message);
        console.log('- المتصفح:', navigator.userAgent);
        console.log('- دعم WebRTC:', !!navigator.mediaDevices);
        console.log('- دعم getUserMedia:', !!navigator.mediaDevices?.getUserMedia);
    }
});

// Leave room
leaveBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to leave?')) {
        leaveRoom();
    }
});

// كتم/إلغاء كتم الصوت
muteBtn.addEventListener('click', () => {
    if (!localStream) return;

    isMuted = !isMuted;
    localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
    });

    muteBtn.classList.toggle('active', isMuted);
    const icon = muteBtn.querySelector('.icon');
    const text = muteBtn.querySelector('.text');
    
    if (isMuted) {
        icon.textContent = '🔇';
        text.textContent = 'Unmute';
    } else {
        icon.textContent = '🎤';
        text.textContent = 'Mute';
    }

    // إخبار الآخرين
    socket.emit('toggle-mute', isMuted);

    // تحديث حالة المستخدم الحالي
    updateUserStatus('me', isMuted);
});

// Toggle video on/off
videoBtn.addEventListener('click', () => {
    if (!localStream) return;

    isVideoOff = !isVideoOff;
    localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOff;
    });

    videoBtn.classList.toggle('active', isVideoOff);
    const icon = videoBtn.querySelector('.icon');
    const text = videoBtn.querySelector('.text');
    
    if (isVideoOff) {
        icon.textContent = '📹';
        text.textContent = 'Start Video';
    } else {
        icon.textContent = '📹';
        text.textContent = 'Stop Video';
    }
});

// نسخ رابط الغرفة
copyLinkBtn.addEventListener('click', () => {
    const url = `${window.location.origin}?room=${currentRoomId}`;
    navigator.clipboard.writeText(url).then(() => {
        const originalText = copyLinkBtn.querySelector('.text').textContent;
        copyLinkBtn.querySelector('.text').textContent = 'Copied! ✓';
        setTimeout(() => {
            copyLinkBtn.querySelector('.text').textContent = originalText;
        }, 2000);
    });
});

// اختبار الشبكة يدوياً
testNetworkBtn.addEventListener('click', async () => {
    const originalText = testNetworkBtn.querySelector('.text').textContent;
    testNetworkBtn.querySelector('.text').textContent = 'Testing...';
    testNetworkBtn.disabled = true;
    
    try {
        const networkResults = await testNetworkConnectivity();
        displayNetworkTestResults(networkResults);
        
        testNetworkBtn.querySelector('.text').textContent = 'Done! ✓';
        setTimeout(() => {
            testNetworkBtn.querySelector('.text').textContent = originalText;
            testNetworkBtn.disabled = false;
        }, 3000);
    } catch (error) {
        console.error('خطأ في اختبار الشبكة:', error);
        testNetworkBtn.querySelector('.text').textContent = 'Error!';
        setTimeout(() => {
            testNetworkBtn.querySelector('.text').textContent = originalText;
            testNetworkBtn.disabled = false;
        }, 3000);
    }
});

// معالج الأحداث من الخادم
socket.on('existing-users', async (users) => {
    console.log('Existing users:', users);
    
    for (const user of users) {
        await createPeerConnection(user.userId, user.username, true);
    }
});

socket.on('user-connected', async (data) => {
    console.log('New user:', data.username);
    addUserToList(data.userId, data.username, false, false);
    await createPeerConnection(data.userId, data.username, false);
});

socket.on('user-disconnected', (data) => {
    console.log('User left:', data.username);
    removeUserFromList(data.userId);
    
    if (peers.has(data.userId)) {
        peers.get(data.userId).close();
        peers.delete(data.userId);
    }
});

socket.on('offer', async (data) => {
    console.log('Receiving offer from:', data.username);
    
    if (!peers.has(data.sender)) {
        await createPeerConnection(data.sender, data.username, false);
    }
    
    const peer = peers.get(data.sender);
    await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
    
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    
    socket.emit('answer', {
        answer: answer,
        target: data.sender
    });
});

socket.on('answer', async (data) => {
    console.log('Receiving answer from:', data.sender);
    
    const peer = peers.get(data.sender);
    if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
});

socket.on('ice-candidate', async (data) => {
    const peer = peers.get(data.sender);
    if (peer && data.candidate) {
        await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
});

socket.on('user-count', (count) => {
    userCountSpan.textContent = count;
});

socket.on('user-muted', (data) => {
    updateUserStatus(data.userId, data.isMuted);
});

// إنشاء اتصال WebRTC مع مستخدم آخر - محسن لجميع المتصفحات
async function createPeerConnection(userId, username, isInitiator) {
    const peer = createRTCPeerConnection(configuration);
    peers.set(userId, peer);

    // إضافة المسار الصوتي المحلي
    if (localStream) {
        localStream.getTracks().forEach(track => {
            peer.addTrack(track, localStream);
        });
    }

    // Receive media tracks from other peer
    peer.ontrack = (event) => {
        console.log('Receiving media from:', username);
        displayRemoteVideo(userId, event.streams[0], username);
    };

    // ICE candidates
    peer.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                candidate: event.candidate,
                target: userId
            });
        }
    };

    // Handle connection state change
    peer.onconnectionstatechange = () => {
        console.log(`Connection state with ${username}:`, peer.connectionState);
        
        if (peer.connectionState === 'connected') {
            console.log(`✅ Successfully connected with ${username}`);
            updateStatus('connected', 'Connected');
        } else if (peer.connectionState === 'connecting') {
            console.log(`🔄 Connecting with ${username}...`);
            updateStatus('connecting', 'Connecting...');
        } else if (peer.connectionState === 'failed') {
            console.log(`❌ Connection failed with ${username}`);
            updateStatus('disconnected', 'Connection Failed');
            
            // محاولة إعادة الاتصال بعد 3 ثوان
            setTimeout(() => {
                if (peer.connectionState === 'failed') {
                    console.log(`🔄 Attempting to reconnect with ${username}`);
                    // إعادة إنشاء الاتصال
                    peers.delete(userId);
                    createPeerConnection(userId, username, isInitiator);
                }
            }, 3000);
        } else if (peer.connectionState === 'disconnected') {
            console.log(`⚠️ Disconnected from ${username}`);
            updateStatus('disconnected', 'Disconnected');
        }
    };

    // معالجة أخطاء ICE
    peer.oniceconnectionstatechange = () => {
        console.log(`ICE connection state with ${username}:`, peer.iceConnectionState);
        
        if (peer.iceConnectionState === 'connected') {
            console.log(`✅ ICE connected with ${username}`);
        } else if (peer.iceConnectionState === 'failed') {
            console.log(`❌ ICE connection failed with ${username}`);
            // محاولة إعادة جمع ICE candidates
            peer.restartIce();
        } else if (peer.iceConnectionState === 'checking') {
            console.log(`🔍 ICE checking with ${username}`);
        }
    };

    // معالجة ICE gathering
    peer.onicegatheringstatechange = () => {
        console.log(`ICE gathering state with ${username}:`, peer.iceGatheringState);
    };

    // معالجة أخطاء ICE candidates
    peer.onicecandidateerror = (event) => {
        console.error(`ICE candidate error with ${username}:`, event);
    };

    // إنشاء وإرسال العرض إذا كنت المبادر
    if (isInitiator) {
        addUserToList(userId, username, false, false);
        
        try {
            const offer = await peer.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            await peer.setLocalDescription(offer);
            
            socket.emit('offer', {
                offer: offer,
                target: userId
            });
        } catch (error) {
            console.error('Error creating offer:', error);
        }
    }

    return peer;
}

// Display local video
function displayLocalVideo() {
    const videoGrid = document.getElementById('video-grid');
    if (!videoGrid) return;
    
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    videoContainer.id = 'video-me';
    
    // فحص نوع المسار المتاح
    const hasVideo = localStream.getVideoTracks().length > 0;
    const hasAudio = localStream.getAudioTracks().length > 0;
    
    if (hasVideo) {
        // عرض الفيديو
        const video = document.createElement('video');
        video.srcObject = localStream;
        video.autoplay = true;
        video.muted = true; // Mute own video to prevent echo
        video.playsInline = true;
        
        const nameTag = document.createElement('div');
        nameTag.className = 'video-name';
        nameTag.textContent = currentUsername + ' (You)';
        
        videoContainer.appendChild(video);
        videoContainer.appendChild(nameTag);
    } else if (hasAudio) {
        // عرض صورة رمزية للصوت فقط
        const audioIcon = document.createElement('div');
        audioIcon.className = 'audio-only-display';
        audioIcon.innerHTML = `
            <div class="audio-icon">🎤</div>
            <div class="audio-text">Audio Only</div>
        `;
        
        const nameTag = document.createElement('div');
        nameTag.className = 'video-name';
        nameTag.textContent = currentUsername + ' (You)';
        
        videoContainer.appendChild(audioIcon);
        videoContainer.appendChild(nameTag);
        
        // إضافة كلاس للصوت فقط
        videoContainer.classList.add('audio-only');
    }
    
    videoGrid.insertBefore(videoContainer, videoGrid.firstChild);
    
    // تحديث حالة أزرار التحكم حسب الأجهزة المتاحة
    updateControlButtons(hasAudio, hasVideo);
}

// Display remote video
function displayRemoteVideo(userId, stream, username) {
    const videoGrid = document.getElementById('video-grid');
    if (!videoGrid) return;
    
    // Remove existing video if any
    const existing = document.getElementById(`video-${userId}`);
    if (existing) existing.remove();
    
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    videoContainer.id = `video-${userId}`;
    
    // فحص نوع المسار المتاح
    const hasVideo = stream.getVideoTracks().length > 0;
    const hasAudio = stream.getAudioTracks().length > 0;
    
    if (hasVideo) {
        // عرض الفيديو
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        
        const nameTag = document.createElement('div');
        nameTag.className = 'video-name';
        nameTag.textContent = username;
        
        videoContainer.appendChild(video);
        videoContainer.appendChild(nameTag);
        
        // Play video
        video.play().catch(e => console.error('Error playing video:', e));
    } else if (hasAudio) {
        // عرض صورة رمزية للصوت فقط
        const audioIcon = document.createElement('div');
        audioIcon.className = 'audio-only-display';
        audioIcon.innerHTML = `
            <div class="audio-icon">🎤</div>
            <div class="audio-text">${username}</div>
        `;
        
        const nameTag = document.createElement('div');
        nameTag.className = 'video-name';
        nameTag.textContent = username;
        
        videoContainer.appendChild(audioIcon);
        videoContainer.appendChild(nameTag);
        
        // إضافة كلاس للصوت فقط
        videoContainer.classList.add('audio-only');
    }
    
    videoGrid.appendChild(videoContainer);
}

// Add user to list
function addUserToList(userId, username, isMuted, isMe) {
    const userItem = document.createElement('div');
    userItem.className = 'user-item';
    userItem.id = `user-${userId}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'user-avatar';
    avatar.textContent = username.charAt(0).toUpperCase();
    
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    
    const userName = document.createElement('div');
    userName.className = 'user-name';
    userName.textContent = username;
    
    const userStatus = document.createElement('div');
    userStatus.className = 'user-status';
    userStatus.textContent = isMuted ? '🔇 Muted' : '🎤 Active';
    
    userInfo.appendChild(userName);
    userInfo.appendChild(userStatus);
    
    userItem.appendChild(avatar);
    userItem.appendChild(userInfo);
    
    if (isMe) {
        usersList.insertBefore(userItem, usersList.firstChild);
    } else {
        usersList.appendChild(userItem);
    }
}

// Remove user from list
function removeUserFromList(userId) {
    const userItem = document.getElementById(`user-${userId}`);
    if (userItem) {
        userItem.remove();
    }
    
    // Remove video
    const videoContainer = document.getElementById(`video-${userId}`);
    if (videoContainer) {
        videoContainer.remove();
    }
}

// Update user status (muted/active)
function updateUserStatus(userId, isMuted) {
    const userItem = document.getElementById(`user-${userId}`);
    if (userItem) {
        const statusElement = userItem.querySelector('.user-status');
        statusElement.textContent = isMuted ? '🔇 Muted' : '🎤 Active';
        statusElement.className = isMuted ? 'user-status muted' : 'user-status';
    }
}

// تحديث حالة الاتصال
function updateStatus(status, text) {
    connectionStatus.className = `status-dot ${status}`;
    statusText.textContent = text;
}

// مغادرة الغرفة
function leaveRoom() {
    // إيقاف جميع الاتصالات
    peers.forEach(peer => peer.close());
    peers.clear();
    
    // إيقاف المسار الصوتي المحلي
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    // قطع الاتصال من الخادم
    socket.disconnect();
    
    // إعادة تحميل الصفحة
    window.location.reload();
}

// تحديث أزرار التحكم حسب الأجهزة المتاحة
function updateControlButtons(hasAudio, hasVideo) {
    const muteBtn = document.getElementById('mute-btn');
    const videoBtn = document.getElementById('video-btn');
    
    // تحديث زر الميكروفون
    if (hasAudio) {
        muteBtn.style.display = 'flex';
        muteBtn.disabled = false;
    } else {
        muteBtn.style.display = 'none';
        muteBtn.disabled = true;
    }
    
    // تحديث زر الكاميرا
    if (hasVideo) {
        videoBtn.style.display = 'flex';
        videoBtn.disabled = false;
    } else {
        videoBtn.style.display = 'none';
        videoBtn.disabled = true;
    }
}

// فحص دعم الأجهزة قبل البدء - محسن لجميع المتصفحات
function checkDeviceSupport() {
    const support = {
        webRTC: false,
        getUserMedia: false,
        audio: false,
        video: false,
        constraints: false,
        browser: getBrowserInfo(),
        version: getBrowserVersion(),
        isSecure: window.location.protocol === 'https:' || window.location.hostname === 'localhost'
    };
    
    // فحص دعم WebRTC الأساسي
    if (typeof navigator !== 'undefined') {
        support.webRTC = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        
        // فحص دعم getUserMedia القديم للمتصفحات القديمة
        if (!support.webRTC) {
            support.webRTC = !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
        }
        
        if (support.webRTC) {
            // فحص دعم القيود المختلفة
            if (navigator.mediaDevices && navigator.mediaDevices.getSupportedConstraints) {
                const constraints = navigator.mediaDevices.getSupportedConstraints();
                support.constraints = constraints;
                support.audio = constraints.audio || false;
                support.video = constraints.video || false;
            } else {
                // افتراضات للمتصفحات القديمة
                support.audio = true;
                support.video = true;
            }
        }
    }
    
    console.log('🔍 دعم الأجهزة:', support);
    return support;
}

// تحديد نوع المتصفح
function getBrowserInfo() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
        return 'Chrome';
    } else if (userAgent.includes('firefox')) {
        return 'Firefox';
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
        return 'Safari';
    } else if (userAgent.includes('edg')) {
        return 'Edge';
    } else if (userAgent.includes('opera') || userAgent.includes('opr')) {
        return 'Opera';
    } else if (userAgent.includes('msie') || userAgent.includes('trident')) {
        return 'Internet Explorer';
    } else {
        return 'Unknown';
    }
}

// تحديد إصدار المتصفح
function getBrowserVersion() {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) {
        const match = userAgent.match(/Chrome\/(\d+)/);
        return match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Firefox')) {
        const match = userAgent.match(/Firefox\/(\d+)/);
        return match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Safari')) {
        const match = userAgent.match(/Version\/(\d+)/);
        return match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Edge')) {
        const match = userAgent.match(/Edg\/(\d+)/);
        return match ? match[1] : 'Unknown';
    } else {
        return 'Unknown';
    }
}

// دعم المتصفحات القديمة - getUserMedia Legacy
function getUserMediaLegacy(constraints) {
    return new Promise((resolve, reject) => {
        const getUserMedia = navigator.getUserMedia || 
                           navigator.webkitGetUserMedia || 
                           navigator.mozGetUserMedia || 
                           navigator.msGetUserMedia;
        
        if (!getUserMedia) {
            reject(new Error('getUserMedia غير مدعوم في هذا المتصفح'));
            return;
        }
        
        getUserMedia.call(navigator, constraints, resolve, reject);
    });
}

// تحسين RTCPeerConnection للمتصفحات القديمة
function createRTCPeerConnection(config) {
    const RTCPeerConnection = window.RTCPeerConnection || 
                             window.webkitRTCPeerConnection || 
                             window.mozRTCPeerConnection;
    
    if (!RTCPeerConnection) {
        throw new Error('RTCPeerConnection غير مدعوم في هذا المتصفح');
    }
    
    return new RTCPeerConnection(config);
}

// اختبار الاتصال وتشخيص مشاكل الشبكة
async function testNetworkConnectivity() {
    console.log('🔍 اختبار الاتصال بالشبكة...');
    
    try {
        // اختبار خوادم STUN و TURN
        const testPeer = createRTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                // اختبار بعض خوادم TURN
                { 
                    urls: 'turn:openrelay.metered.ca:80',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                { 
                    urls: 'turn:freeturn.tel:3478',
                    username: 'free',
                    credential: 'free'
                }
            ]
        });
        
        return new Promise((resolve) => {
            let stunWorking = false;
            let turnWorking = false;
            let hostWorking = false;
            
            testPeer.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('📡 ICE Candidate found:', event.candidate.type, event.candidate.candidate);
                    
                    if (event.candidate.type === 'host') {
                        console.log('✅ Host candidate - الاتصال المحلي يعمل');
                        hostWorking = true;
                    } else if (event.candidate.type === 'srflx') {
                        console.log('✅ STUN candidate - خوادم STUN تعمل');
                        stunWorking = true;
                    } else if (event.candidate.type === 'relay') {
                        console.log('✅ TURN candidate - خوادم TURN تعمل');
                        turnWorking = true;
                    }
                } else {
                    console.log('🔍 انتهاء جمع ICE candidates');
                    
                    setTimeout(() => {
                        testPeer.close();
                        resolve({
                            stun: stunWorking,
                            turn: turnWorking,
                            local: hostWorking
                        });
                    }, 2000);
                }
            };
            
            // بدء جمع ICE candidates
            testPeer.createDataChannel('test');
            testPeer.createOffer().then(offer => {
                testPeer.setLocalDescription(offer);
            });
            
            // timeout بعد 15 ثانية لإعطاء وقت أكثر لخوادم TURN
            setTimeout(() => {
                testPeer.close();
                resolve({
                    stun: stunWorking,
                    turn: turnWorking,
                    local: hostWorking
                });
            }, 15000);
        });
        
    } catch (error) {
        console.error('❌ خطأ في اختبار الشبكة:', error);
        return {
            stun: false,
            turn: false,
            local: false,
            error: error.message
        };
    }
}

// عرض نتائج اختبار الشبكة
function displayNetworkTestResults(results) {
    console.log('📊 نتائج اختبار الشبكة:', results);
    
    let message = '🔍 نتائج اختبار الاتصال:\n\n';
    
    if (results.local) {
        message += '✅ الاتصال المحلي: يعمل\n';
    } else {
        message += '❌ الاتصال المحلي: لا يعمل\n';
    }
    
    if (results.stun) {
        message += '✅ خوادم STUN: تعمل\n';
    } else {
        message += '❌ خوادم STUN: لا تعمل\n';
    }
    
    if (results.turn) {
        message += '✅ خوادم TURN: تعمل\n';
    } else {
        message += '❌ خوادم TURN: لا تعمل\n';
    }
    
    if (!results.stun && !results.turn) {
        message += '\n⚠️ تحذير: قد تواجه مشاكل في الاتصال مع الأشخاص في أماكن أخرى.\n';
        message += 'يرجى:\n';
        message += '1. التحقق من إعدادات Firewall\n';
        message += '2. تجربة شبكة أخرى\n';
        message += '3. الاتصال بالمدير التقني';
    } else if (results.stun && !results.turn) {
        message += '\n✅ ممتاز! خوادم STUN تعمل - يمكن الاتصال مع معظم الأشخاص.\n';
        message += '💡 نصائح:\n';
        message += '1. جرب الاتصال مع الأشخاص في أماكن أخرى\n';
        message += '2. إذا لم يعمل، جرب شبكة أخرى\n';
        message += '3. التطبيق يعمل بشكل جيد مع معظم الشبكات';
    } else if (results.stun && results.turn) {
        message += '\n🎉 ممتاز! جميع الخوادم تعمل - يمكن الاتصال مع أي شخص في أي مكان!';
    }
    
    console.log(message);
    
    // إظهار النتائج للمستخدم إذا كانت هناك مشاكل
    if (!results.stun || !results.turn) {
        setTimeout(() => {
            alert(message);
        }, 1000);
    }
}

// توليد رقم غرفة عشوائي
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// التحقق من رقم الغرفة في رابط URL وفحص دعم الأجهزة
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    
    if (roomFromUrl) {
        roomIdInput.value = roomFromUrl;
    }
    
    // فحص دعم الأجهزة عند تحميل الصفحة
    const deviceSupport = checkDeviceSupport();
    
    console.log('🔍 معلومات المتصفح:', {
        browser: deviceSupport.browser,
        version: deviceSupport.version,
        isSecure: deviceSupport.isSecure,
        webRTC: deviceSupport.webRTC,
        getUserMedia: deviceSupport.getUserMedia
    });
    
    if (!deviceSupport.webRTC) {
        const message = `⚠️ متصفحك (${deviceSupport.browser} ${deviceSupport.version}) لا يدعم WebRTC.\n\nيرجى:\n1. تحديث المتصفح إلى أحدث إصدار\n2. تجربة متصفح آخر مثل Chrome أو Firefox\n3. التأكد من تفعيل JavaScript`;
        alert(message);
        joinBtn.disabled = true;
        joinBtn.textContent = 'WebRTC غير مدعوم';
    } else if (!deviceSupport.isSecure && window.location.hostname !== 'localhost') {
        const message = `⚠️ يجب استخدام HTTPS للوصول للأجهزة.\n\nيرجى:\n1. التأكد من أن الموقع يستخدم https://\n2. أو استخدام localhost للتطوير`;
        alert(message);
        joinBtn.disabled = true;
        joinBtn.textContent = 'HTTPS مطلوب';
    } else {
        console.log('✅ المتصفح مدعوم - يمكن المتابعة');
        
        // اختبار الاتصال بالشبكة بعد تحميل الصفحة
        setTimeout(async () => {
            const networkResults = await testNetworkConnectivity();
            displayNetworkTestResults(networkResults);
        }, 2000);
    }
});

// معالجة إغلاق النافذة
window.addEventListener('beforeunload', () => {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
});


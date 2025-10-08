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

// إعدادات WebRTC
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
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
        // Request access to microphone and camera
        localStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }, 
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            }
        });

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
        console.error('Error accessing media devices:', error);
        alert('Failed to access camera/microphone! Please allow access to both.');
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

// إنشاء اتصال WebRTC مع مستخدم آخر
async function createPeerConnection(userId, username, isInitiator) {
    const peer = new RTCPeerConnection(configuration);
    peers.set(userId, peer);

    // إضافة المسار الصوتي المحلي
    localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream);
    });

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
            console.log(`Successfully connected with ${username}`);
        } else if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') {
            console.log(`Connection failed with ${username}`);
        }
    };

    // إنشاء وإرسال العرض إذا كنت المبادر
    if (isInitiator) {
        addUserToList(userId, username, false, false);
        
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        
        socket.emit('offer', {
            offer: offer,
            target: userId
        });
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
    videoGrid.insertBefore(videoContainer, videoGrid.firstChild);
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
    
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    
    const nameTag = document.createElement('div');
    nameTag.className = 'video-name';
    nameTag.textContent = username;
    
    videoContainer.appendChild(video);
    videoContainer.appendChild(nameTag);
    videoGrid.appendChild(videoContainer);
    
    // Play video
    video.play().catch(e => console.error('Error playing video:', e));
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

// توليد رقم غرفة عشوائي
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// التحقق من رقم الغرفة في رابط URL
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    
    if (roomFromUrl) {
        roomIdInput.value = roomFromUrl;
    }
});

// معالجة إغلاق النافذة
window.addEventListener('beforeunload', () => {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
});


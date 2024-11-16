// // PWA 서비스 워커 등록
// if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.register('/sw.js').then(function() {
//         console.log('Service Worker Registered');
//     });
// }

// // 음성 안내 함수
// function speak(text) {
//     const utterance = new SpeechSynthesisUtterance(text);
//     utterance.lang = 'ko-KR';
//     window.speechSynthesis.speak(utterance);
// }
 
 

// // 지도와 경로 표시 관련 코드
// let map, marker;

// function initMap() {
//     const initialPosition = new kakao.maps.LatLng(37.5665, 126.9780);
    
//     map = new kakao.maps.Map(document.getElementById("map"), {
//         center: initialPosition,
//         level: 3
//     });

//     marker = new kakao.maps.Marker({
//         map: map,
//         position: initialPosition
//     });
// }

// // 신호등 상태 업데이트 함수
// function updateTrafficLightStatus(data) {
//     const statusElement = document.getElementById('status');
//     const { distanceToSignal, signalColor, timeToGreen, isFlashing, hasCrosswalk, hasApproachingVehicle } = data;

//     // 신호등이 있을 때
//     if (distanceToSignal <= 10) {
//         if (signalColor === 'red') {
//             if (timeToGreen > 0) {
//                 const message = `현재 신호등이 빨간 불입니다. 다음 초록 불까지 ${timeToGreen}초 남았습니다.`;
//                 statusElement.textContent = message;
//                 speak(message);
//             }
//         } else if (signalColor === 'green') {
//             if (isFlashing) {
//                 statusElement.textContent = "다음 신호를 기다려주십시오";
//                 speak("다음 신호를 기다려주십시오");
//             } else {
//                 statusElement.textContent = "현재 신호등이 초록 불입니다.";
//                 speak("현재 신호등이 초록 불입니다.");
//             }
//         }
//     } else if (distanceToSignal > 10) {
//         statusElement.textContent = "전방 10m 이내에 신호등이 없습니다.";
//         speak("전방 10m 이내에 신호등이 없습니다.");
//     }

//     // 신호등이 없는 보도일 때
//     if (!hasCrosswalk) {
//         statusElement.textContent = "전방의 보도는 신호등이 없는 보도입니다.";
//         speak("전방의 보도는 신호등이 없는 보도입니다.");
        
//         if (hasApproachingVehicle) {
//             statusElement.textContent += " 현재 접근하는 차량이 있습니다. 유의하시기 바랍니다.";
//             speak("현재 접근하는 차량이 있습니다. 유의하시기 바랍니다.");
//         }
//     }
// }

// // 서버에서 신호등 데이터를 가져오는 함수
// async function fetchTrafficLightData() {
//     // 서버에서 데이터 가져오기
//     const response = await fetch('/api/traffic-light');
//     const data = await response.json();
//     updateTrafficLightStatus(data);
// }

// // 위치 기반 네비게이션 시작 함수
// function startNavigation() {
//     if (navigator.geolocation) {
//         navigator.geolocation.watchPosition(position => {
//             const { latitude, longitude } = position.coords;

//             // 현재 위치 데이터를 서버에 보내고 신호등 상태 업데이트 요청
//             fetchTrafficLightData();
//         }, error => {
//             console.error("위치 정보를 가져오는데 실패했습니다.", error);
//             speak("위치 정보를 가져오는데 실패했습니다.");
//         });
//     } else {
//         alert("Geolocation이 지원되지 않는 브라우저입니다.");
//     }
// }

// // 네비게이션 시작 버튼 클릭 이벤트
// document.getElementById('start-navigation').addEventListener('click', startNavigation);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// 초기 설정// 초기 설정
let countdownInterval;
let signalColor = 'red'; // 초기 신호 상태

// 음성 안내 함수
function speak(text) {
    console.log(`Speaking: ${text}`); // 로그 출력으로 확인
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    window.speechSynthesis.speak(utterance);
}

// 카운트다운 함수

function startCountdown(timeToChange, isGreenLight, isFlashing = false) {
    clearInterval(countdownInterval);

    const countdownElement = document.getElementById('countdown');
    
    // 카운트다운 색상 설정
    countdownElement.classList.remove('red', 'green', 'blink');
    countdownElement.classList.add(isGreenLight ? 'green' : 'red');
    let originalTime = timeToChange; // 주어진 원래 시간 저장

    // 깜박임을 위한 변수
    let blinkInterval;

    // 카운트다운 시작
    countdownInterval = setInterval(() => {
        countdownElement.textContent = timeToChange;

        // 시간이 60% 이하로 남았고 초록불인 경우 깜박이기 시작
        if (isGreenLight && timeToChange <= originalTime * 0.6) {
            // 깜박임이 아직 시작되지 않았으면 시작
            if (!blinkInterval) {
                blinkInterval = setInterval(() => {
                    countdownElement.style.visibility = countdownElement.style.visibility === 'hidden' ? 'visible' : 'hidden';
                }, 500); // 500ms 간격으로 깜박임
            }
        }

        // 시간이 0초가 될 때의 동작
        if (timeToChange === 0) {
            clearInterval(countdownInterval);
            if (blinkInterval) clearInterval(blinkInterval); // 깜박임 멈춤
            countdownElement.style.visibility = 'visible'; // 최종적으로 보이도록 설정

            if (isGreenLight) {
                speak("빨간 불이 되었습니다.");
                signalColor = 'red';
                stopNavigation(); // 빨간 불이 되면 stopNavigation 호출
            } else {
                speak("초록 불이 되었습니다.");
                signalColor = 'green';
                startCountdown(10, true); // 새로운 초록 불 카운트다운 시작 (예: 10초)
            }
        }
        timeToChange -= 1;
    }, 1000);
}


// 신호등 상태 업데이트 함수
function updateTrafficLightStatus(data) {
    const { signalColor, timeToGreen, isFlashing } = data;

    if (signalColor === 'red') {
        speak(`현재 신호등이 빨간 불입니다. 다음 초록 불까지 ${timeToGreen}초 남았습니다.`);
        startCountdown(timeToGreen, false); // 빨간 불에서 초록 불로 카운트다운
    } 
    else if (signalColor === 'green') {
        if (isFlashing) {
            speak("다음 신호를 기다려 주십시오");
            startCountdown(5, true, true); // 점멸 상태에서 N초 후 빨간 불로 전환
        } else {
            speak("현재 신호등이 초록 불입니다.");
            startCountdown(timeToGreen, true); // 초록 불에서 빨간 불로 카운트다운
        }
    }
}

// 임의의 테스트 데이터를 사용하는 함수
function fetchTrafficLightData() {
    const testData = {
        signalColor: signalColor,
        timeToGreen: signalColor === 'red' ? 15 : 10, // 예: 빨간 불은 15초, 초록 불은 10초
        isFlashing: signalColor === 'green' && Math.random() > 0.5 // 임의로 점멸 상태 설정
    };

    updateTrafficLightStatus(testData);
}

// 네비게이션 시작 함수
function startNavigation() {
    document.getElementById('start-navigation').style.display = 'none';
    document.getElementById('stop-navigation').style.display = 'block';
    fetchTrafficLightData(); // 테스트 데이터로 신호등 상태 업데이트
}

// 네비게이션 종료 함수
function stopNavigation() {
    clearInterval(countdownInterval); // 카운트다운 정지
    document.getElementById('start-navigation').style.display = 'block';
    document.getElementById('stop-navigation').style.display = 'none';
    document.getElementById('countdown').textContent = "";

    // 종료 알림 음성 출력
    speak("신호등 정보 알림을 종료합니다.");
}

// 버튼 클릭 이벤트
document.getElementById('start-navigation').addEventListener('click', startNavigation);
document.getElementById('stop-navigation').addEventListener('click', stopNavigation);

// API
const apiUrl = "https://port-0-blinker-m3b39e20a1510d6a.sel4.cloudtype.app/confirm/json";

// 데이터를 가져오는 함수
async function fetchData() {
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }); 

        if (!response.ok) {
            throw new Error(`HTTP 오류 발생: ${response.status}`);
        }

        const data = await response.json(); // 응답 데이터를 JSON으로 변환
        console.log(data)
        
        return data; // 데이터를 반환
    } catch (error) {
        console.error('API 호출 중 오류 발생:', error);
        return { message: '오류가 발생했습니다.' }; // 에러 메시지 반환
    }
}

// 데이터를 화면에 표시하는 함수
function displayData(data) {
    const container = document.getElementById('data-container');
    container.textContent = data.message || '데이터 없음'; // message 키의 값 표시
}

// 버튼 클릭 이벤트 추가
document.getElementById('fetch-button').addEventListener('click', async () => {
    const data = await fetchData(); // 데이터를 가져오고
    displayData(data); // 화면에 표시
});

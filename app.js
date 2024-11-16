// 초기 설정// 초기 설정
let countdownInterval;
let color = 'red'; // 초기 신호 상태

// 음성 안내 함수
function speak(text) {
    console.log(`Speaking: ${text}`); // 로그 출력으로 확인
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    window.speechSynthesis.speak(utterance);
}

// API
// 데이터를 가져오는 함수
async function fetchCrossboardData() {
    const apiUrl = "https://port-0-blinker-m3b39e20a1510d6a.sel4.cloudtype.app/main_crossboard";

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


// 카운트다운 함수
function startCountdown(timeToChange, isGreenLight, isFlashing = false,  green_total_time) {
    clearInterval(countdownInterval);

    const countdownElement = document.getElementById('countdown');
    
    // 카운트다운 색상 설정
    countdownElement.classList.remove('red', 'green', 'blink');
    countdownElement.classList.add(isGreenLight ? 'green' : 'red');

    // 깜박임을 위한 변수
    let blinkInterval;

    // 카운트다운 시작
    countdownInterval = setInterval(() => {
        countdownElement.textContent = timeToChange;
        // 시간이 60% 이하로 남았고 초록불인 경우 깜박이기 시작
        if (isGreenLight && timeToChange <= green_total_time * 0.6) {
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
                color = 'red';
                stopNavigation(); // 빨간 불이 되면 stopNavigation 호출
            } else {
                speak("초록 불이 되었습니다.");
                color = 'green';
                startCountdown(green_total_time, true, false, green_total_time); // 새로운 초록 불 카운트다운 시작 
                monitorCarApproach(3000); // 3초 동안 차량 접근 확인
            }
        }
        timeToChange -= 1;
    }, 1000);
}

// 차량 접근 확인 함수
async function monitorCarApproach(duration) {
    const startTime = Date.now(); // 시작 시간 기록
    let vehicleAlerted = false; // 차량 접근 안내 여부 플래그

    async function poll() {
        const elapsedTime = Date.now() - startTime; // 경과 시간 계산
        // 3초가 경과하면 종료
        if (elapsedTime >= duration) {
            console.log("monitorCarApproach 종료");
            return;
        }

        try {
            console.log("monitorCarApproach poll 실행"); // 디버깅 로그
            const data = await fetchCrossboardData(true); // API 호출로 데이터 가져오기
            console.log(data)
            if (data && data.car_approaching) {
                speak("접근중인 차량이 있습니다. 주의하세요");
                vehicleAlerted = true; // 차량 접근 안내 완료 플래그 설정
                return;
            }
        } catch (error) {
            console.error("monitorCarApproach 오류:", error); // 오류 로그
        }

        // 1초 후 재귀적으로 호출
        setTimeout(poll, 1000);
    }

    poll(); // 폴링 시작
}


// 신호등 상태 업데이트 함수
function updateTrafficLightStatus(data) {
    console.log(data)
    // 데이터 구조에 맞는 변수 추출
    const {
        color, // 신호등 색상 ("red" or "green")
        time_remaining, // 현재 색상의 남은 시간
        green_total_time,
        red_total_time,
        non_blinker, // 신호등 없는 횡단보도 여부
        car_approaching // 차량 접근 여부
    } = data;    

    let isFlashing = false

    if (color === "green" && time_remaining <= green_total_time * 0.6) {
        isFlashing = true; // 점멸 상태 설정
    } else {
        isFlashing = false; // 점멸 상태 해제
    }

    if (non_blinker) {
        // 신호등 없는 횡단보도
        speak("신호등이 없는 횡단보도입니다. 주의하세요");
        monitorCarApproach(3000); // 3초 동안 차량 접근 확인
    } else {
        // 신호등 있는 횡단보도
        if (color === 'red') {
            if (time_remaining === 0) {
                // 빨간 불에서 초록 불로 전환
                speak("초록 불이 되었습니다.");
            } else {
                speak(`현재 신호등이 빨간 불입니다. 다음 초록 불까지 ${time_remaining}초 남았습니다.`);
            }
            startCountdown(time_remaining, false, false, green_total_time); // 빨간 불 카운트다운
        } else if (color === 'green') {
            // 초록 불 상태
            if (isFlashing) {
                speak("다음 신호를 기다려 주십시오");
                startCountdown(time_remaining, true, true, green_total_time); // 점멸 상태에서 N초 후 빨간 불로 전환
            } else {
                speak("현재 신호등이 초록 불입니다.");
                startCountdown(time_remaining, true, false, green_total_time); // 초록 불 카운트다운
            }
        }
    }
}


let navigationInterval = null;

// 데이터 폴링 함수
async function pollData() {
    try {
        const data = await fetchCrossboardData(true); // Mock 데이터 사용

        if (data) {
            updateTrafficLightStatus(data); // 데이터 처리
        } else {
            console.warn("fetchCrossboardData에서 null 반환");
        }
    } catch (error) {
        console.error("pollData에서 오류 발생:", error); // 오류 확인
    } finally {
        // 3초 후 재호출
        // navigationInterval = setTimeout(pollData, 3000);
    }
}

// 네비게이션 시작 함수
function startNavigation() {
    console.log("startNavigation 호출됨"); // 디버깅 로그
    document.getElementById('start-navigation').style.display = 'none';
    document.getElementById('stop-navigation').style.display = 'block';
    pollData(); // 폴링 시작
}

// 네비게이션 종료 함수
function stopNavigation() {
    console.log("stopNavigation 호출됨"); // 디버깅 로그
    clearTimeout(navigationInterval); // 폴링 중지
    clearInterval(countdownInterval)
    navigationInterval = null;
    document.getElementById('start-navigation').style.display = 'block';
    document.getElementById('stop-navigation').style.display = 'none';
    document.getElementById('countdown').textContent = ""; // 카운트다운 초기화
    speak("신호등 정보 알림을 종료합니다.");
}

// 버튼 클릭 이벤트
document.getElementById('start-navigation').addEventListener('click', startNavigation);
document.getElementById('stop-navigation').addEventListener('click', stopNavigation);

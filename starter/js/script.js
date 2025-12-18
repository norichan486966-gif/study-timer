// ここからJavaScriptを書いていきましょう！
// ==============================================
// 1. 要素と変数の定義
// ==============================================
// HTML要素の取得
const display = document.getElementById('time-display');
/* IDが 'time-display' の要素（タイマーの数字）を取得！ */
const startBtn = document.getElementById('start-btn');
/* スタートボタンを取得！ */
const stopBtn = document.getElementById('stop-btn');
/* ストップボタンを取得！ */
const recordBtn = document.getElementById('record-btn');
/* 記録ボタンを取得！ */
const graphArea = document.getElementById('study-graph');
/* グラフを描画するエリアの箱を取得！ */
const dataResetBtn = document.getElementById('data-reset-btn');
/* 全データリセットボタンを取得！ */
// --- 状態管理のための変数に追加 ---
let GOAL_SECONDS = null;
let GOAL_HOUR_INPUT;
let GOAL_MINUTE_INPUT;
let SET_GOAL_BUTTON;
let CURRENT_GOAL_DISPLAY;

// HTMLのbody要素も取得しておく（背景色を変えるために必要！）
const bodyElement = document.body;
// 状態管理のための変数
let timerInterval = null;
/* タイマーが動いているかどうかの状態（ID）を保存する変数。null は「何も入ってない」状態だよ！ */
let totalSeconds = 0;
/* 今、タイマーで計測中の合計秒数を記録する変数。 */
const STORAGE_KEY = 'daily_study_totals';
/* ローカルストレージにデータを保存するときに使う「キー（鍵）」の名前を定数として定義！ */

// ==============================================
// 2. ユーティリティ関数（共通で使う関数）
// ==============================================

// 秒を「時:分:秒」に変換する関数
function formatTime(seconds) {
/* 引数として渡された秒数 (seconds) を受け取って処理するよ！ */
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    /* 3600秒(1時間)で割って「時」を計算。padStart(2, '0')は「1」を「01」にする処理だよ！ */
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    /* 3600で割った余りを60秒(1分)で割って「分」を計算。 */
    const s = String(seconds % 60).padStart(2, '0');
    /* 60で割った余りが「秒」になるよ！ */
    return `${h}:${m}:${s}`;
    /* 計算した時・分・秒をコロンで繋げて、文字列として返す！ */
}
// 秒を「時:分」に変換する関数（目標表示用）
function formatGoalTime(seconds) {
    const totalMinutes = Math.floor(seconds / 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}時間${String(m).padStart(2, '0')}分`;
}

// 目標を計算し、保存して、画面に表示する関数
function setGoal() {
    // 入力値を取得（文字列なので Number() で数値に変換）
    const hours = Number(GOAL_HOUR_INPUT.value) || 0;
    const minutes = Number(GOAL_MINUTE_INPUT.value) || 0;

    // 目標秒数を計算！
    const newGoalSeconds = (hours * 3600) + (minutes * 60);
    
    // 計算結果を変数に代入し、ローカルストレージにも保存しておく（ブラウザを閉じても目標が残るように！）
    GOAL_SECONDS = newGoalSeconds;
    localStorage.setItem('study_goal', GOAL_SECONDS); 

    // 画面の目標表示を更新
    CURRENT_GOAL_DISPLAY.textContent = `現在の目標: ${formatGoalTime(GOAL_SECONDS)}`;
    
    // 目標達成済みなら、画面の色を更新する
    const totals = getDailyTotals();
    const today = getTodayDate();
    const currentTotal = totals[today] || 0;
    checkGoal(currentTotal);
}
 
// ==============================================
// 3. 画面切り替え機能
// ==============================================

function showScreen(screenId) {
/* 指定された画面ID（timer-screenなど）の画面を表示するための関数！ */
    // 全ての画面から 'active' クラスを外して非表示にする
    document.querySelectorAll('.screen').forEach(screen => {
    /* class="screen" の要素全てを取得し、一つずつ処理を繰り返すよ！ */
        screen.classList.remove('active');
        /* 今ついてる active クラスを外して、CSSで非表示（display: none;）にする！ */
    });

    // 指定されたIDの画面に 'active' クラスをつけて表示する
    document.getElementById(screenId).classList.add('active');
    /* 指定された ID の要素に active クラスを付けて、CSSで表示（display: block;）にする！ */

    // グラフ画面に切り替わったら、グラフを再描画する
    if (screenId === 'graph-screen') {
    /* もし切り替わった先がグラフ画面だったら... */
        renderGraph();
        /* グラフを最新のデータで描き直す関数を呼び出す！ */
    }
}

// ==============================================
// 4. タイマー機能
// ==============================================

// 1秒ごとに実行される関数
function updateTimer() {
    totalSeconds++;
    /* totalSeconds（秒数）を1増やす！ */
    display.textContent = formatTime(totalSeconds);
    /* 画面に表示されている時間を更新！ */
    // 計測中なら記録ボタンを押せるようにする
    if (totalSeconds > 0) {
    /* 0秒より多ければ... */
        recordBtn.disabled = false;
        /* 記録ボタンを使えるようにする！ */
    }
}

startBtn.addEventListener('click', () => {
/* スタートボタンが「クリックされた」ときの処理を設定！ */
    if (timerInterval !== null) return;
    /* もしタイマーがすでに動いていたら、何もしないで処理を終了（二重起動防止）！ */

    timerInterval = setInterval(updateTimer, 1000);
    /* 1000ミリ秒（つまり1秒）ごとに updateTimer 関数を繰り返し実行するよう設定！
       この繰り返し処理のIDを timerInterval に保存しておく。 */

    // ボタンの状態を切り替える
    startBtn.disabled = true;
    /* スタートボタンを押せなくする */
    stopBtn.disabled = false;
    /* ストップボタンを押せるようにする */
    recordBtn.disabled = true;
    /* スタート直後は記録ボタンを使えないようにしておく */
});

stopBtn.addEventListener('click', () => {
/* ストップボタンが「クリックされた」ときの処理を設定！ */
    if (timerInterval === null) return;
    /* もしタイマーが動いていなかったら、何もしないで処理を終了！ */

    clearInterval(timerInterval);
    /* setInterval で設定した繰り返し処理を「やめて！」と命令する！これでタイマーが止まる。 */
    timerInterval = null;
    /* タイマーが止まったので、状態を null に戻しておく！ */
    
    // ボタンの状態を切り替える
    startBtn.disabled = false;
    /* スタートボタンを押せるようにする */
    stopBtn.disabled = true;
    /* ストップボタンを押せなくする */
    recordBtn.disabled = (totalSeconds === 0);
    /* totalSecondsが0なら記録ボタンを押せないようにする（計測してないなら記録は不要だから） */
});

// ==============================================
// 5. 記録・保存機能（ローカルストレージ使用）
// ==============================================

function getTodayDate() {
/* 今日の日付を「YYYY-MM-DD」形式の文字列で取得する関数！ */
    const date = new Date();
    /* 今日の日付と時刻が入った Date オブジェクトを作成！ */
    const year = date.getFullYear();
    /* 年を取得 */
    const month = String(date.getMonth() + 1).padStart(2, '0');
    /* 月を取得。getMonth()は0から始まるので +1 が必要！ */
    const day = String(date.getDate()).padStart(2, '0');
    /* 日を取得。 */
    return `${year}-${month}-${day}`;
    /* 例: "2025-12-14" の形で返す！ */
}

function getDailyTotals() {
/* ローカルストレージから保存されている全データを読み込む関数！ */
    const data = localStorage.getItem(STORAGE_KEY);
    /* 'daily_study_totals' キーで保存されている文字列を取得！ */
    // データがなかったら空のオブジェクトを返す
    return data ? JSON.parse(data) : {};
    /* data があれば JSON.parse でJavaScriptで使えるオブジェクトに戻し、なければ空のオブジェクト {} を返す！ */
}

function saveDailyTotals(totals) {
/* 日付ごとの記録データ（totalsオブジェクト）をローカルストレージに保存する関数！ */
    localStorage.setItem(STORAGE_KEY, JSON.stringify(totals));
    /* JavaScriptのオブジェクトを、localStorageに保存できる文字列 (JSON形式) に変換して保存する！ */
}

recordBtn.addEventListener('click', () => {
/* 記録ボタンがクリックされた時の処理！ */
    if (totalSeconds === 0) return;
    /* 0秒だったら記録せずに終了！ */

    // 1. 今日の日付と現在の記録を取得
    const today = getTodayDate();
    /* 今日の日付を取得！ */
    const totals = getDailyTotals();
    /* これまでの記録データをすべて読み込む！ */

    // 2. 今日の記録に加算
    // totals[today]がまだ存在しなければ 0 を使う
    const currentTotal = totals[today] || 0;
    /* 今日の記録がまだあればそれを、なければ 0 を使う！ */
    const newTotal = currentTotal + totalSeconds;
    totals[today] = newTotal;
    /* 今日の記録に、今計測した時間を足して、新しい今日の合計として保存！ */

function checkGoal(currentTotalSeconds) {
    // 今日の合計時間（currentTotalSeconds）が目標時間を超えたかどうかをチェック！
    if (currentTotalSeconds >= GOAL_SECONDS) {
        // 目標達成！
        bodyElement.classList.add('goal-achieved');
        // body要素に 'goal-achieved' という特別なクラスを追加するよ！
        return true;
    } else {
        // まだ目標未達成
        bodyElement.classList.remove('goal-achieved');
        // もし達成クラスがついていたら削除しておく
        return false;
    }
}
    
    // 3. ローカルストレージに保存
    saveDailyTotals(totals);
    /* 更新された全データをローカルストレージに書き込む！ */
// 4. ★目標達成チェック！
    if (checkGoal(newTotal)) {
        alert(`🎉 目標達成おめでとう！今日の勉強時間は ${formatTime(newTotal)} だよ！`);
    } else {
        alert(`今日の記録に ${formatTime(totalSeconds)} が追加されました！💪`);
    }
    // 4. タイマーをリセット
    const recordedTime = formatTime(totalSeconds); // 記録した時間をメッセージ用に確保
    totalSeconds = 0;
    /* 計測中の秒数を 0 に戻す！ */
    display.textContent = formatTime(0);
    /* タイマーの表示を 00:00:00 に戻す！ */
    recordBtn.disabled = true;
    /* 記録が終わったのでまた押せなくする */

    alert(`今日の記録に ${recordedTime} が追加されました！🎉`);
    /* 記録が完了したことをユーザーに知らせるアラートを表示！ */
    showScreen('home-screen');
    /* 記録が終わったらメニュー画面に戻る！ */
});

// ==============================================
// 6. グラフ描画機能
// ==============================================

function renderGraph() {
/* 記録データを読み込んでグラフを描画する関数！ */
    const totals = getDailyTotals();
    /* 全記録データを取得！ */
    const graphData = [];
    /* グラフに使うデータを入れる空の配列を用意！ */
    const today = new Date();
    /* 今日の日付オブジェクトを取得！ */
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    /* 1日あたりのミリ秒（計算用） */

    // 過去7日間のデータを準備する
    for (let i = 6; i >= 0; i--) {
    /* i を 6 から 0 まで（過去7日分）繰り返す！ */
        const date = new Date(today.getTime() - i * MS_PER_DAY);
        /* i日前の日付オブジェクトを作成！ */
        const dateStr = getTodayDateString(date);
        /* YYYY-MM-DD 形式の文字列に変換！ */
        const dayLabel = getDayName(date.getDay());
        /* 曜日（日、月、火...）を取得！ */
        
        graphData.push({
            date: dateStr,
            dayLabel: dayLabel,
            seconds: totals[dateStr] || 0 // 記録がなければ 0
            /* 日付、曜日ラベル、秒数（記録がなければ 0）をセットにして配列に追加！ */
        });
    }

    // 記録が全くない場合はメッセージを表示
    if (Object.keys(totals).length === 0) {
    /* 記録データが入っているオブジェクトのキー（日付）がゼロ、つまり記録がない場合 */
        graphArea.innerHTML = '';
        /* グラフエリアの中身を空にする */
        document.getElementById('graph-message').textContent = 'まだ記録がありません。タイマーで勉強時間を記録しよう！';
        /* メッセージを表示する！ */
        return;
        /* 処理を終了！ */
    }
    document.getElementById('graph-message').textContent = '';
    /* 記録があればメッセージを消す！ */

    // グラフ描画のロジック
    graphArea.innerHTML = '';
    /* グラフを描き直すために、一旦グラフエリアの中身を全部消す！ */
    const maxTime = Math.max(...graphData.map(d => d.seconds));
    /* 過去7日間の中で、一番長い勉強時間（秒数）を探す！これをグラフの高さの基準にするよ！ */

    graphData.forEach(item => {
    /* 7日分のデータ一つ一つに対して、棒グラフの要素を作成していく！ */
        // 棒グラフの高さ（一番長い時間を 100% と見立てる）
        const heightPercent = maxTime === 0 ? 0 : (item.seconds / maxTime) * 100;
        /* 棒の高さを、最大時間に対する割合で計算する！ */
        
        const barContainer = document.createElement('div');
        /* 新しい <div> 要素（棒の親箱）を作成！ */
        barContainer.className = 'bar-container';
        /* CSSのクラスを適用！ */

        // 時間のラベルを作成
        const timeLabel = document.createElement('div');
        /* 新しい <div> 要素（時間ラベル）を作成！ */
        timeLabel.className = 'time-label';
        timeLabel.textContent = formatTime(item.seconds);
        /* 秒数を「時:分:秒」に変換してテキストとして入れる！ */

        // 棒グラフの本体を作成
        const bar = document.createElement('div');
        /* 新しい <div> 要素（棒）を作成！ */
        bar.className = 'bar';
        bar.style.height = `${heightPercent}px`;
        /* ここで計算した割合を使って、棒の CSS の高さを設定する！（height: 〇〇px;） */
        bar.style.minHeight = item.seconds > 0 ? '5px' : '0';
        /* 記録が少しでもあれば、棒が見えるように最低5pxの高さを確保する！ */

        // 曜日のラベルを作成
        const dayLabelElement = document.createElement('div');
        /* 新しい <div> 要素（曜日ラベル）を作成！ */
        dayLabelElement.className = 'day-label';
        dayLabelElement.textContent = item.dayLabel;
        /* 曜日のテキスト（例: 月、火）を入れる！ */

        // すべてをコンテナに追加
        barContainer.appendChild(timeLabel);
        barContainer.appendChild(bar);
        barContainer.appendChild(dayLabelElement);
        /* ラベル、棒、曜日ラベルを順番に親箱（barContainer）に入れる！ */
        graphArea.appendChild(barContainer);
        /* 作成した棒グラフセットを、グラフエリア全体に追加する！ */
    });
}

function getTodayDateString(date) {
/* Dateオブジェクトを「YYYY-MM-DD」形式の文字列に変換するヘルパー関数 */
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDayName(dayIndex) {
/* 曜日の数字（0:日, 6:土）を名前に変換するヘルパー関数 */
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[dayIndex];
}

// ==============================================
// 7. データリセット機能
// ==============================================

dataResetBtn.addEventListener('click', () => {
/* データリセットボタンがクリックされたときの処理！ */
    if (confirm('本当にすべての勉強時間をリセットしますか？この操作は元に戻せません！')) {
    /* confirm()で「OK」か「キャンセル」か確認のポップアップを出す！ */
        localStorage.removeItem(STORAGE_KEY);
        /* ローカルストレージから、すべての記録データ（STORAGE_KEYに保存したもの）を削除する！ */
        alert('全ての記録が削除されました！');
        /* 削除完了をユーザーに知らせる！ */
        renderGraph();
        /* グラフを更新し、空のメッセージを表示させる！ */
    }
});

// = initializes the app on load =
// 起動時にまず実行される！
showScreen('home-screen');
/* ページが読み込まれたら、まずメイン画面（main-screen）を表示する関数を呼び出す！ */

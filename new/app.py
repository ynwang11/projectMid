from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

from flask import Flask, render_template, request, redirect, url_for, session

app = Flask(__name__)
app.secret_key = 'your_secret_key_here' # 必须设置密钥以启用 session

# 简易数据暂存：写入 instance/data 下，避免用户手动重复输入
DATA_DIR = os.path.join(app.instance_path, "data")
os.makedirs(DATA_DIR, exist_ok=True)


def _safe_user_id(u: str) -> str:
    u = (u or "guest").strip()
    return "".join(ch for ch in u if ch.isalnum() or ch in ("-", "_"))[:64] or "guest"


def _vitals_path(user: str) -> str:
    return os.path.join(DATA_DIR, f"vitals_{_safe_user_id(user)}.jsonl")

def _config_path(user: str) -> str:
    return os.path.join(DATA_DIR, f"config_{_safe_user_id(user)}.json")

def _load_user_config(user: str) -> dict:
    path = _config_path(user)
    if not os.path.exists(path):
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f) or {}
    except Exception:
        return {}

def _save_user_config(user: str, cfg: dict) -> None:
    path = _config_path(user)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(cfg or {}, f, ensure_ascii=False, indent=2)


def _is_local_ollama_base(base_url: str) -> bool:
    """Ollama 默认监听 :11434，提供 OpenAI 兼容的 /v1/chat/completions，本地可不带 API Key。"""
    u = (base_url or "").strip().lower()
    if ":11434" in u:
        return True
    try:
        from urllib.parse import urlparse

        p = urlparse(base_url.strip())
        return p.port == 11434
    except Exception:
        return False


def _openai_compatible_chat(
    base_url: str, model: str, messages: list, api_key: str | None, timeout: int
) -> str:
    import urllib.request

    url = f"{base_url.rstrip('/')}/v1/chat/completions"
    body = {"model": model, "messages": messages, "temperature": 0.7}
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode("utf-8")
    data = json.loads(raw)
    reply = (
        data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    )
    if not reply:
        raise RuntimeError("empty_reply")
    return reply


def _append_jsonl(path: str, obj: dict) -> None:
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")


def _load_jsonl(path: str, since: datetime | None = None, limit: int = 20000) -> list[dict]:
    if not os.path.exists(path):
        return []
    out: list[dict] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except Exception:
                continue
            ts = obj.get("ts")
            if since and ts:
                try:
                    dt = datetime.fromisoformat(ts)
                except Exception:
                    dt = None
                if dt and dt < since:
                    continue
            out.append(obj)
            if len(out) >= limit:
                break
    return out


def _score_from_vitals(d: dict) -> int:
    """把演示 vitals 转成 0-100 的身心指数（用于长期趋势）。"""
    try:
        stress = float(d.get("stress", 0.5))
    except Exception:
        stress = 0.5
    base = 92 - int(round(stress * 40))
    # 小幅引入 HR/HRV/呼吸稳定性，避免完全随机
    try:
        hr = float(d.get("hr", 80))
        hrv = float(d.get("hrv", 45))
    except Exception:
        hr, hrv = 80.0, 45.0
    if hr < 58 or hr > 108:
        base -= 6
    if hrv >= 60:
        base += 3
    if not d.get("resp_stable", True):
        base -= 4
    return int(max(35, min(98, base)))

# 模拟用户数据库
USER_DATA = {"admin": "123456"}

# 路由：登录页面
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if username in USER_DATA and USER_DATA[username] == password:
            session['user'] = username # 记录登录状态
            return redirect(url_for('dashboard'))
        return "登录失败，用户名或密码错误"
    return render_template('login.html')

# 路由：退出登录
@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('index'))


TOOLS_CONFIG = {
    'tool_a': {
        'title': '生理数据实时监测中心',
        'desc': '云中海岛与耳狐精灵相伴，实时心率、呼吸、皮电、HRV、体温一目了然；底部可上传文件进行原分析。',
    },
    'tool_b': {
        'title': 'AI心理多维分析中心',
        'desc': '夜晚星光图书馆中，与白鼬学者共读心理图谱；下方可连接实时监测流。',
    },
    'tool_history': {
        'title': '长期身心报告档案馆',
        'desc': '在四季花海记忆花园中翻阅水晶档案、情绪日历与长期趋势。',
    },
    'tool_c': {
        'title': '系统参数设置',
        'desc': '在这里配置您的 API 密钥、数据库连接及其他全局变量。'
    }
}

# ---------------------------------------------------------
# 路由 1：启动页 - 沉浸式云端森林场景
# ---------------------------------------------------------
@app.route('/')
def launch():
    return render_template('launch.html')

# ---------------------------------------------------------
# 路由 2：原始首页（保留为备用）
# ---------------------------------------------------------
@app.route('/home')
def index():
    return render_template('index.html')

# ---------------------------------------------------------
# 路由 2：网页端主界面（处理工具切换和结果展示）
# ---------------------------------------------------------
@app.route('/dashboard/<tool_name>')
@app.route('/dashboard', defaults={'tool_name': 'tool_a'})
def dashboard(tool_name):
    # 1. 安全检查：使用 .get()，如果没登录会返回 None，不会报错
    user = session.get('user')
    
    # 2. 如果没登录，重定向到登录页
    if not user:
        return redirect(url_for('login'))
    
    # 3. 正常逻辑
    current_tool = TOOLS_CONFIG.get(tool_name, TOOLS_CONFIG['tool_a'])
    analysis_result = request.args.get('result', '')
    
    # 4. 确保将 user 变量传给模板
    return render_template(
        'dashboard.html', 
        user=user,  # 这里用上面获取到的 user 变量
        tool=current_tool, 
        active_tool=tool_name, 
        analysis_result=analysis_result
    )
# ---------------------------------------------------------
# 路由 3：分析逻辑（处理文件上传）
# ---------------------------------------------------------
@app.route('/analyze', methods=['POST'])
def analyze():
    # 检查是否有文件上传
    if 'file' not in request.files:
        return redirect(url_for('dashboard', tool_name='tool_a', result="错误：未找到文件字段"))
    
    file = request.files['file']
    
    if file.filename == '':
        return redirect(url_for('dashboard', tool_name='tool_a', result="错误：未选择任何文件"))

    if file:
        # --- 在这里编写你的 Python 分析逻辑 ---
        # 示例：我们读取文件名并模拟一个分析报告
        filename = file.filename
        
        # 模拟分析过程...
        import datetime
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        mock_report = (
            f"--- 分析报告 ---\n"
            f"处理时间: {timestamp}\n"
            f"上传文件: {filename}\n"
            f"状态: 分析成功\n"
            f"结果摘要: 检测到数据一致性良好，模型预测准确率为 98.5%。"
        )
        
        # 分析完成后，带着结果重定向回工具 A 页面
        return redirect(url_for('dashboard', tool_name='tool_a', result=mock_report))

    return redirect(url_for('dashboard', tool_name='tool_a'))

import time
from flask import Response



# 新增：模拟从另一个程序获取数据的生成器
def generate_realtime_data():
    # 这里以后可以对接你另一个程序的 Socket 或 API
    count = 0
    while True:
        time.sleep(1)  # 模拟每秒产生一条数据
        count += 1
        data = f"时间: {time.strftime('%H:%M:%S')} | 检测值: {count * 1.5} | 状态: 正常\n"
        # SSE 格式要求必须以 'data: ' 开头，以 '\n\n' 结尾
        yield f"data: {data}\n\n"

# 新增：数据流路由
@app.route('/stream')
def stream():
    return Response(generate_realtime_data(), mimetype='text/event-stream')


@app.route('/api/history-data')
def get_history_data():
    import random

    rng = request.args.get("range", "today")
    seed = hash((rng, request.remote_addr or "")) % (2**32)
    random.seed(seed)

    ring = {
        "labels": ["愉悦", "平静", "焦虑", "低落", "亢奋"],
        "values": [random.randint(8, 32) for _ in range(5)],
    }
    radar = {
        "labels": ["情绪稳定", "认知清晰", "社交能量", "自我关怀", "睡眠质", "压力感"],
        "values": [random.randint(42, 96) for _ in range(6)],
    }
    wave = {
        "labels": [f"{i + 1}" for i in range(12)],
        "values": [random.randint(50, 92) for _ in range(12)],
    }
    curve = {
        "labels": ["一", "二", "三", "四", "五", "六", "日"],
        "values": [random.randint(55, 95) for _ in range(7)],
    }
    bars = {
        "labels": ["HRV", "静息", "步数", "深睡", "心率变", "皮温"],
        "values": [random.randint(40, 98) for _ in range(6)],
    }
    polar = {
        "labels": ["专注", "放松", "积极", "敏感", "复原"],
        "values": [random.randint(35, 95) for _ in range(5)],
    }

    range_label = {"realtime": "实时", "today": "今日", "week": "本周", "month": "本月"}.get(
        rng, "今日"
    )
    ai_text = (
        f"【{range_label}心象综述】当前维度显示：情绪谱以「{ring['labels'][ring['values'].index(max(ring['values']))]}」成分略突出；"
        f"认知与自我调节维度整体处于温和区间。波浪曲线提示日内波动存在 {random.randint(2, 4)} 个小峰，"
        "建议在高峰前安排 5 分钟呼吸锚定。生理条带与心理雷达呈弱正相关，说明身心联动良好。"
        "点击任一带光图表可展开细读；亦可点下方文字听我慢慢说。"
    )

    details = {
        "ring": "环形图 · 情绪成分占比：用于观察主导情绪色调，非诊断标签。",
        "radar": "雷达图 · 六维心理资源：数值越高表示该维度近期自评越充足。",
        "wave": "波浪图 · 12 时段波动：模拟一日内心理能量起伏。",
        "curve": "曲线图 · 周趋势：连接每日综合指数。",
        "bars": "柱状图 · 生理代理指标：与主观感受对照阅读。",
        "polar": "极区图 · 五维平衡：专注—放松—积极等轴的相对形状。",
    }

    return jsonify(
        {
            "range": rng,
            "ring": ring,
            "radar": radar,
            "wave": wave,
            "curve": curve,
            "bars": bars,
            "polar": polar,
            "ai_text": ai_text,
            "details": details,
        }
    )


if __name__ == '__main__':
    # debug=True 允许你修改代码后页面自动重载，无需手动重启服务器
    app.run(debug=True, port=5000)
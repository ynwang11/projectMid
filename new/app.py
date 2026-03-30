from flask import Flask, render_template, request, redirect, url_for, session, jsonify

app = Flask(__name__)
app.secret_key = 'your_secret_key_here' # 必须设置密钥以启用 session

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


@app.route('/healing')
def healing():
    if not session.get('user'):
        return redirect(url_for('login'))
    return render_template('healing.html')


@app.route('/profile')
def profile_archive():
    """个人身心档案 & 隐私中心（精灵小屋场景）。"""
    if not session.get('user'):
        return redirect(url_for('login'))
    return render_template('profile_cabin.html', user=session.get('user'))


@app.route('/api/healing-vitals')
def healing_vitals():
    """模拟生理状态：异常时前端切换极柔和安抚场景（无警报）。"""
    import random
    force = request.args.get('force')
    if force == 'calm':
        return jsonify({'abnormal': True, 'soft': True})
    if force == 'ok':
        return jsonify({'abnormal': False, 'soft': True})
    return jsonify({'abnormal': random.random() < 0.06, 'soft': True})


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


@app.route("/api/vitals-live")
def vitals_live():
    """模拟实时生理与情绪数据，驱动耳狐状态与魔法球配色。"""
    import random
    import time

    random.seed(int(time.time() * 10) % 100000)

    def walk_series(n, start, spread):
        out = []
        v = float(start)
        for _ in range(n):
            v += random.uniform(-spread, spread)
            out.append(round(v, 2))
        return out

    hr = int(round(random.uniform(62, 96)))
    resp = round(random.uniform(11, 22), 1)
    eda = round(random.uniform(0.1, 1.8), 2)
    hrv = int(round(random.uniform(28, 68)))
    temp = round(random.uniform(36.0, 37.4), 1)

    stress = random.uniform(0.12, 0.88)
    hr_stable = random.random() > 0.42
    resp_stable = random.random() > 0.38

    if stress < 0.38:
        emotion = "calm"
    elif stress < 0.58:
        emotion = "relaxed"
    else:
        emotion = "anxious"

    abnormal = stress > 0.74 or hr < 56 or hr > 108 or (not resp_stable and stress > 0.62)

    return jsonify(
        {
            "hr": hr,
            "resp": resp,
            "eda": eda,
            "hrv": hrv,
            "temp": temp,
            "stress": round(stress, 3),
            "hr_stable": hr_stable,
            "resp_stable": resp_stable,
            "emotion": emotion,
            "abnormal": abnormal,
            "series": {
                "hr": walk_series(32, hr, 1.8),
                "resp": walk_series(32, resp, 0.35),
                "eda": walk_series(32, eda, 0.08),
                "hrv": walk_series(32, hrv, 2.0),
                "temp": walk_series(32, temp, 0.04),
            },
        }
    )


@app.route('/api/history-data')
def get_history_data():
    """周趋势 + 记忆花园扩展字段（日历、水晶档案、季节、AI 摘要）。原 labels/values 不变。"""
    import calendar as calmod
    import random
    from datetime import date

    today = date.today()
    y, m = today.year, today.month
    _, days_in_month = calmod.monthrange(y, m)

    labels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
    values = [random.randint(60, 100) for _ in range(7)]

    calendar_days = []
    for d in range(1, days_in_month + 1):
        score = random.randint(55, 98)
        if score >= 86:
            mood = "great"
        elif score >= 76:
            mood = "good"
        elif score >= 68:
            mood = "calm"
        elif score >= 58:
            mood = "low"
        else:
            mood = "rest"
        calendar_days.append({"day": d, "score": score, "mood": mood})

    if 3 <= m <= 5:
        season = "spring"
    elif 6 <= m <= 8:
        season = "summer"
    elif 9 <= m <= 11:
        season = "autumn"
    else:
        season = "winter"

    avg = sum(values) // max(len(values), 1)
    ai_summary = (
        f"近一周身心指数均值约 {avg}。记忆花园记录显示，您的状态多集中在「平和—向好」区间；"
        "建议保持规律作息与正念呼吸，水晶档案中的周报告可作为阶段小结回顾。"
    )

    reports = [
        {
            "id": "day-1",
            "type": "day",
            "title": f"{today.month} 月 {today.day} 日 · 日报告",
            "summary": "今日节律与睡眠压力指标整体温和。",
            "detail": "【日报告】\n"
            "· 身心得分波动较小，午后专注力略高。\n"
            "· 建议：轻度伸展 8 分钟，晚间减少屏幕 20 分钟。",
        },
        {
            "id": "week-1",
            "type": "week",
            "title": "第 " + str((today.day - 1) // 7 + 1) + " 周 · 周报告",
            "summary": "本周情绪曲线呈缓慢回升趋势。",
            "detail": "【周报告】\n"
            "· 周二—周四压力略集中，周末恢复度良好。\n"
            "· 可尝试：固定起床时间 + 每周三次户外活动。",
        },
        {
            "id": "month-1",
            "type": "month",
            "title": f"{today.year} 年 {today.month} 月 · 月报告",
            "summary": "月度资源感提升，社交耗能需留意边界。",
            "detail": "【月报告】\n"
            "· 正向体验日记条数较上月 +12%。\n"
            "· 下月焦点：能量管理与小步目标。",
        },
        {
            "id": "year-1",
            "type": "year",
            "title": f"{today.year} 年 · 年度报告",
            "summary": "年度主线：从紧绷走向更有弹性的自处方式。",
            "detail": "【年度报告】\n"
            "· 四个季度中，第三季度心力波动最大，第四季度修复明显。\n"
            "· 新岁寄语：允许休息，也是成长的一部分。",
        },
    ]

    return jsonify(
        {
            "labels": labels,
            "values": values,
            "season": season,
            "year": y,
            "month": m,
            "month_label": f"{m} 月",
            "calendar": calendar_days,
            "reports": reports,
            "ai_summary": ai_summary,
        }
    )


@app.route("/api/psych-analysis")
def psych_analysis():
    """心理多维分析可视化数据（按时间维度切换）；与 /stream 实时流独立。"""
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
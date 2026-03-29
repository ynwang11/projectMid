from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

from flask import Flask, render_template, request, redirect, url_for, session

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
        'title': '手动上传数据',
        'desc': '请上传您的检测数据文件（支持 .csv, .xlsx, .txt），点击开始分析获取结果。'
    },
    'tool_b': {
        'title': '实时数据监测',
        'desc': '点击下方按钮连接远程程序，获取实时监测流。'
    },
    'tool_history': {
        'title': '历史数据查询', 
        'desc': '查看并分析您的历史检测记录。'
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
    # 模拟数据：日期和对应的检测得分
    data = {
        "labels": ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
        "values": [random.randint(60, 100) for _ in range(7)]
    }
    return flask.jsonify(data)



if __name__ == '__main__':
    # debug=True 允许你修改代码后页面自动重载，无需手动重启服务器
    app.run(debug=True, port=5000)
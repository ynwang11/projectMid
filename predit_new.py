# predict.py
import joblib
import pandas as pd
import sys
import os

# 1. 固定路径（按你实际存放的改）
MODEL_PATH = "emotion_rf_model.pkl"
TEST_CSV   = "merged_output.csv"          # 测试样例
OUT_TXT    = "predictions.txt"   # 输出文件

# 2. 加载模型
model = joblib.load(MODEL_PATH)

# 3. 读测试数据
df = pd.read_csv(TEST_CSV)

# 4. 去掉“label”列（如果存在），保持特征顺序与训练时一致
X = df.drop(columns=['label'], errors='ignore')

# 5. 预测
preds = model.predict(X)

# 6. 写入 txt，一行一个标签
with open(OUT_TXT, 'w', encoding='utf-8') as f:
    for p in preds:
        f.write(f"{p}\n")

print(f"预测完成！结果已保存到 {os.path.abspath(OUT_TXT)}，共 {len(preds)} 条记录。")

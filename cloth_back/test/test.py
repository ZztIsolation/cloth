import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.services.ai_service import parse_ai_result

if __name__ == "__main__":
    print("请输入AI返回的标签字符串：")
    text = input()
    result = parse_ai_result(text)
    print("解析结果：")
    print(result) 
"""
验证签名算法
"""
import hashlib

# 从用户提供的cURL中提取的数据
_m_h5_tk = "fcfaee10bf64bc0b3ed667432fc6d525_1762797076975"
token = _m_h5_tk.split('_')[0]  # fcfaee10bf64bc0b3ed667432fc6d525

timestamp = "1762788077126"
appKey = "12574478"
data = "{}"

# 预期签名
expected_sign = "601c7403e44cb873f26faa49b0175a78"

# 计算签名
sign_input = f"{token}&{timestamp}&{appKey}&{data}"
calculated_sign = hashlib.md5(sign_input.encode()).hexdigest()

print("=" * 80)
print("签名验证结果")
print("=" * 80)
print(f"Token:          {token}")
print(f"Timestamp:      {timestamp}")
print(f"AppKey:         {appKey}")
print(f"Data:           {data}")
print(f"\n签名输入:       {sign_input}")
print(f"\n预期签名:       {expected_sign}")
print(f"计算签名:       {calculated_sign}")
print(f"\n验证结果:       {'✅ 匹配！签名算法正确！' if calculated_sign == expected_sign else '❌ 不匹配'}")
print("=" * 80)

"""
兑换请求分析
用户提供的兑换红包请求分析
"""
import json
from urllib.parse import unquote

# 用户提供的第二个请求（兑换红包）
exchange_url = """https://h5api.m.tmall.com/h5/mtop.fisson.gift.share.vcoin.exchange/1.0/?jsv=2.6.1&appKey=12574478&t=1762790177105&sign=ecf3f54163c4e84246b30c3d6e6f897f&api=mtop.fisson.gift.share.vcoin.exchange&v=1.0&ecode=1&timeout=4096&isSec=1&secType=2&needWua=true&isNeedWua=true&needRetry=true&type=jsonp&dataType=jsonp&asac=2A21B24LA1SI0HB0EEVN03&callback=mtopjsonp7&data=%7B%22asac%22%3A%222A21B24LA1SI0HB0EEVN03%22%2C%22benefitCode%22%3A%2266e434e7bf3e49509a2f54c979bda34a%22%2C%22type%22%3A%22redPacket%22%2C%22ua%22%3A%22140%23nmuoUceczzPKw..."""

# 提取data参数（已URL编码）
data_encoded = "%7B%22asac%22%3A%222A21B24LA1SI0HB0EEVN03%22%2C%22benefitCode%22%3A%2266e434e7bf3e49509a2f54c979bda34a%22%2C%22type%22%3A%22redPacket%22%2C%22ua%22%3A%22140%23nmuoUceczzPKwQo2%2BbsbK3N8s9zoGBz%2B%2Bpst0aPrbTaWOHfLrvVKnCmvnSMxRV%2FaKFITlp1zzXgB6bWggbzxDo0d7th%2Fzzrb22U3l61DDvw%2BtA%2FqUb%2Bx2oa3V3gqz%2B%2Bxd6rVOSvZrI7ZbhGatVKoy8A3GyouJZ2FrRW0nG3B%2ByX5D%2BaWBPgAUVHwx09FnQzutXoaGxP7UddL44z0TJO3t6jQgWPWTpzgDmeALU1pFUK7kWD1QzKWX3Oje9MVnR32ev%2FXNCBrOBa2zPFEKNUnjI7KU%2FLuAuGjMnflJYSZwdK7P2FDj6NA3fzawK3uctwGvKYlTa%2FmNYwStANNm%2F3mlSHiczZTjIrwwh0ADB30uoIg%2Fya%2FNYBzNmJ9aS0TImo%2BWjMpWnhCqRVR%2B78bIgS1dgoKuItZ4LDuJMRxB6rgTw87A%2Fw74frGg65W9TDjpgB9FzOSoYtOK2zf6RBmMjJMsOWrYrUZoGD1DEgT%2FYRbPLleXpGDCSY8kONCucfuwywixjV7kkZ4mfidjL246skDrvnrgteyyffOQgAl4UDGiOCn14PrvGuygTFscG%2BSc5%2BKfzfkKWLcYBQ%2B7W6dXfTDXB%2F5l9KkruA36p845ENn8PN5YhdfpufVOawPrPxB%2BsL6hLWI9Rvxz2l%2FY6GxZiLWfZMdbw%2BlZk0SdRHf%2Fa9TWLXRHlg3XpoNXbP0VGBNLtW0WoXyNMih08ZXhl7NT8FVhqF%2Bb%2FATY%2B6SZltkENZ4VFs9dG3slw8BXrsU7ejw5cexm9TKLQblf3Q0Qa0YOniBGTesLT%2FzYrpUnDO5Cg0Ubn6%2FG5qurEDyt4PSxqs0PbRh79CSbO%2FGbKqYmSqzxONzYiDcxp5L13Nlsf3KGXiaG6g5VlBreCI7nHIL7WS40WoarvYhHa7AtyS%3D%22%2C%22umidToken%22%3A%22T2gArl5MCqpJaBLQXh3b0XpsLlW0Q8QIGFCyCRFo-Sexi_R96cJYmWwtsGL-5k4Eav0%3D%22%7D"

# URL解码
data_decoded = unquote(data_encoded)
print("=" * 100)
print("兑换请求分析")
print("=" * 100)

print("\n1. API信息:")
print("-" * 100)
print(f"   API名称: mtop.fisson.gift.share.vcoin.exchange")
print(f"   ⚠️  注意: 拼写是 'fisson'，不是 'fission'！")
print(f"   版本: 1.0")
print(f"   方法: GET")
print(f"   域名: https://h5api.m.tmall.com")

print("\n2. URL参数:")
print("-" * 100)
params = {
    "jsv": "2.6.1",
    "appKey": "12574478",
    "t": "1762790177105",
    "sign": "ecf3f54163c4e84246b30c3d6e6f897f",
    "api": "mtop.fisson.gift.share.vcoin.exchange",
    "v": "1.0",
    "ecode": "1",
    "timeout": "4096",
    "isSec": "1",
    "secType": "2",
    "needWua": "true",
    "isNeedWua": "true",
    "needRetry": "true",
    "type": "jsonp",
    "dataType": "jsonp",
    "asac": "2A21B24LA1SI0HB0EEVN03",
    "callback": "mtopjsonp7"
}
for key, value in params.items():
    print(f"   {key:15s} = {value}")

print("\n3. data参数（解码后）:")
print("-" * 100)
print(data_decoded)

print("\n4. data参数（JSON格式）:")
print("-" * 100)
try:
    data_json = json.loads(data_decoded)
    print(json.dumps(data_json, indent=2, ensure_ascii=False))
    
    print("\n5. 关键字段分析:")
    print("-" * 100)
    print(f"   asac:        {data_json.get('asac', 'N/A')}")
    print(f"                ↑ 风控参数，每次请求都不同")
    print(f"   benefitCode: {data_json.get('benefitCode', 'N/A')}")
    print(f"                ↑ 红包/商品的唯一标识码")
    print(f"   type:        {data_json.get('type', 'N/A')}")
    print(f"                ↑ 兑换类型：redPacket=红包, 商品可能是其他值")
    print(f"   umidToken:   {data_json.get('umidToken', 'N/A')[:50]}...")
    print(f"                ↑ 用户设备唯一标识token")
    print(f"   ua:          {data_json.get('ua', 'N/A')[:50]}...")
    print(f"                ↑ 设备指纹，超长字符串")
    
except json.JSONDecodeError as e:
    print(f"   JSON解析失败: {e}")

print("\n6. 重要发现:")
print("-" * 100)
print("   ✅ 找到了兑换接口！")
print("   ✅ API名称是 mtop.fisson.gift.share.vcoin.exchange")
print("   ⚠️  用户兑换的是'红包'（type: redPacket）")
print("   ⚠️  还需要兑换'商品'的请求（type可能不同）")
print()
print("   关键参数:")
print("   - asac: 风控参数（每次不同）")
print("   - benefitCode: 红包/商品标识")
print("   - type: 类型（redPacket或其他）")
print("   - ua: 设备指纹")
print("   - umidToken: 设备token")

print("\n7. 签名验证:")
print("-" * 100)
print("   需要验证的签名参数:")
print(f"   timestamp: {params['t']}")
print(f"   appKey:    {params['appKey']}")
print(f"   data:      {data_decoded[:100]}...")
print(f"   sign:      {params['sign']}")

print("\n8. 安全参数:")
print("-" * 100)
print("   isSec:      1  (启用安全验证)")
print("   secType:    2  (安全类型)")
print("   needWua:    true (需要无线设备UA)")
print("   isNeedWua:  true")
print("   ecode:      1")

print("\n" + "=" * 100)
print("结论:")
print("=" * 100)
print("✅ 这是一个有效的兑换请求（兑换红包）")
print("⏳ 还需要兑换'商品'的请求来对比参数差异")
print("⏳ 需要验证签名算法是否与之前的一致")
print("=" * 100)

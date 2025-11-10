"""
红包抢购示例程序
专注于天猫礼享金红包兑换功能
"""

from TSDK.api.taobao.gift import TmallGiftAPI
from TSDK.utils.cookie_manager import CookieManager
from loguru import logger
import time
import json


def main():
    """红包抢购主程序"""
    
    logger.info("=" * 80)
    logger.info("天猫礼享金红包抢购系统")
    logger.info("=" * 80)
    
    # 1. 初始化API
    api = TmallGiftAPI()
    cookie_manager = CookieManager()
    
    # 2. 加载Cookie
    logger.info("\n步骤1: 加载登录Cookie")
    user_id = "maxtung614"  # 替换为您的淘宝用户名
    
    cookies_dict = cookie_manager.get_cookies(user_id)
    if not cookies_dict:
        logger.error(f"未找到用户 {user_id} 的Cookie，请先运行登录程序")
        logger.info("提示: 您需要先手动添加Cookie或使用扫码登录")
        return
    
    # 设置Cookie到API
    api.set_cookies(cookies_dict)
    logger.success(f"成功加载用户 {user_id} 的Cookie")
    
    # 3. 获取红包列表
    logger.info("\n步骤2: 获取可兑换红包列表")
    red_packets = api.get_red_packets()
    
    if not red_packets:
        logger.warning("暂无可兑换红包")
        return
    
    logger.success(f"发现 {len(red_packets)} 个可兑换红包:")
    for idx, packet in enumerate(red_packets, 1):
        logger.info(
            f"  {idx}. {packet.get('title', 'N/A')} - "
            f"{packet.get('coinAmount', '0')}礼享金 - "
            f"benefitCode: {packet.get('benefitCode', 'N/A')}"
        )
    
    # 4. 选择要兑换的红包
    logger.info("\n步骤3: 准备兑换红包")
    target_packet = red_packets[0]  # 选择第一个红包
    
    logger.info(f"目标红包: {target_packet.get('title')}")
    logger.info(f"所需礼享金: {target_packet.get('coinAmount')}")
    logger.info(f"benefitCode: {target_packet.get('benefitCode')}")
    
    # 5. 获取必需参数
    logger.info("\n步骤4: 获取兑换所需参数")
    
    # 从页面数据获取asac参数
    page_data = api.get_exchange_all_page()
    asac = page_data.get('drawAsacCode', '') if page_data else ''
    
    if not asac:
        logger.warning("未能获取asac参数，尝试使用默认值")
        asac = "2A21B24LA1SI0HB0EEVN03"  # 从抓包数据中的值
    
    logger.info(f"asac参数: {asac}")
    
    # TODO: 获取ua和umidToken参数
    # 这两个参数需要从浏览器环境中提取，暂时使用占位符
    ua = get_ua_from_browser()  # 需要实现
    umid_token = get_umid_token_from_browser()  # 需要实现
    
    if not ua:
        logger.warning("⚠️  未能获取ua参数")
        logger.info("提示: ua参数需要从浏览器页面JS中提取")
        logger.info("临时方案: 可以从抓包数据中复制ua值")
    
    if not umid_token:
        logger.warning("⚠️  未能获取umidToken参数")
        logger.info("提示: umidToken通常可以从Cookie或LocalStorage中获取")
    
    # 6. 执行兑换
    logger.info("\n步骤5: 开始兑换红包")
    logger.info("=" * 80)
    
    result = api.exchange_red_packet(
        benefit_code=target_packet.get('benefitCode'),
        asac=asac,
        ua=ua,
        umid_token=umid_token
    )
    
    if result:
        logger.success("🎉 兑换成功!")
        logger.info(f"兑换结果: {json.dumps(result, ensure_ascii=False, indent=2)}")
    else:
        logger.error("❌ 兑换失败")
        logger.info("可能原因:")
        logger.info("  1. 礼享金不足")
        logger.info("  2. 红包已被抢光")
        logger.info("  3. ua或umidToken参数无效")
        logger.info("  4. Cookie已过期")
    
    logger.info("=" * 80)


def get_ua_from_browser():
    """
    从浏览器环境获取ua参数
    
    ua参数是一个超长的Base64字符串，包含设备指纹信息
    实际应用中需要从页面JavaScript中提取
    
    临时方案:
    1. 打开浏览器开发者工具Console
    2. 执行: window.umidData || window._umdata
    3. 查找ua字段的值
    4. 或者从抓包数据中复制
    
    Returns:
        ua字符串，如果获取失败返回None
    """
    # TODO: 实现从浏览器获取ua的逻辑
    # 可能的方法:
    # 1. 使用Playwright/Selenium执行JS获取
    # 2. 从LocalStorage读取
    # 3. 从页面全局变量中提取
    
    logger.warning("get_ua_from_browser() 尚未实现")
    logger.info("临时方案: 请从抓包数据中复制ua值")
    logger.info("示例: ua='140#nmuoUceczzPKw...'")
    
    return None


def get_umid_token_from_browser():
    """
    从浏览器环境获取umidToken参数
    
    umidToken是阿里的设备唯一标识，通常存储在:
    1. Cookie中 (可能的key: _umidToken, umidToken)
    2. LocalStorage中
    3. 页面全局变量中
    
    Returns:
        umidToken字符串，如果获取失败返回None
    """
    # TODO: 实现从浏览器获取umidToken的逻辑
    # 可能的方法:
    # 1. 从Cookie中读取
    # 2. 从LocalStorage读取
    # 3. 从页面JS变量中提取
    
    logger.warning("get_umid_token_from_browser() 尚未实现")
    logger.info("临时方案: 请从抓包数据中复制umidToken值")
    logger.info("示例: umidToken='T2gArl5MCqpJaBLQXh...'")
    
    return None


def advanced_snatch_demo():
    """
    高级抢购示例 - 定时抢购
    """
    logger.info("=" * 80)
    logger.info("高级红包抢购 - 定时抢购模式")
    logger.info("=" * 80)
    
    api = TmallGiftAPI()
    cookie_manager = CookieManager()
    
    # 加载Cookie
    user_id = "maxtung614"
    cookies_dict = cookie_manager.get_cookies(user_id)
    if not cookies_dict:
        logger.error("请先配置Cookie")
        return
    
    api.set_cookies(cookies_dict)
    
    # 设置抢购参数
    target_benefit_code = "66e434e7bf3e49509a2f54c979bda34a"  # 目标红包的benefitCode
    snatch_time = "2025-11-10 12:00:00"  # 抢购时间
    
    logger.info(f"目标红包: {target_benefit_code}")
    logger.info(f"抢购时间: {snatch_time}")
    
    # TODO: 实现定时抢购逻辑
    logger.info("等待抢购时间...")
    
    # 提前准备参数
    page_data = api.get_exchange_all_page()
    asac = page_data.get('drawAsacCode', '')
    
    # 在抢购时间点执行
    # result = api.exchange_red_packet(...)
    
    logger.info("抢购完成")


def batch_snatch_demo():
    """
    批量抢购示例 - 抢购所有可用红包
    """
    logger.info("=" * 80)
    logger.info("批量红包抢购")
    logger.info("=" * 80)
    
    api = TmallGiftAPI()
    cookie_manager = CookieManager()
    
    # 加载Cookie
    user_id = "maxtung614"
    cookies_dict = cookie_manager.get_cookies(user_id)
    if not cookies_dict:
        logger.error("请先配置Cookie")
        return
    
    api.set_cookies(cookies_dict)
    
    # 获取所有红包
    red_packets = api.get_red_packets()
    
    logger.info(f"发现 {len(red_packets)} 个可兑换红包")
    
    # 获取asac参数
    page_data = api.get_exchange_all_page()
    asac = page_data.get('drawAsacCode', '')
    
    # 批量兑换
    success_count = 0
    fail_count = 0
    
    for idx, packet in enumerate(red_packets, 1):
        logger.info(f"\n正在兑换第 {idx}/{len(red_packets)} 个红包...")
        logger.info(f"红包: {packet.get('title')}")
        
        result = api.exchange_red_packet(
            benefit_code=packet.get('benefitCode'),
            asac=asac,
            ua=get_ua_from_browser(),
            umid_token=get_umid_token_from_browser()
        )
        
        if result:
            success_count += 1
            logger.success(f"✅ 兑换成功 ({success_count}/{idx})")
        else:
            fail_count += 1
            logger.error(f"❌ 兑换失败 ({fail_count}/{idx})")
        
        # 避免请求过快
        time.sleep(0.5)
    
    logger.info("\n" + "=" * 80)
    logger.info(f"批量兑换完成:")
    logger.info(f"  成功: {success_count}")
    logger.info(f"  失败: {fail_count}")
    logger.info(f"  总计: {len(red_packets)}")
    logger.info("=" * 80)


if __name__ == "__main__":
    # 运行基本示例
    main()
    
    # 运行高级示例（取消注释以使用）
    # advanced_snatch_demo()
    # batch_snatch_demo()

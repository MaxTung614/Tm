#!/usr/bin/env python3
"""
风控参数验证工具
"""
import json
import sys
from pathlib import Path
from typing import Dict, Any
from loguru import logger


class RiskParameterValidator:
    """风控参数验证器"""
    
    def __init__(self, params_file: str = "data/risk_params.json"):
        self.params_file = Path(params_file)
        self.params = {}
        self.validation_results = {}
    
    def load_params(self) -> bool:
        """加载参数文件"""
        try:
            if not self.params_file.exists():
                logger.error(f"配置文件不存在: {self.params_file}")
                return False
            
            with open(self.params_file, 'r', encoding='utf-8') as f:
                self.params = json.load(f)
            
            logger.success("✅ 配置文件加载成功")
            return True
            
        except Exception as e:
            logger.error(f"加载配置文件失败: {e}")
            return False
    
    def validate_ua(self) -> Dict[str, Any]:
        """验证 UA（设备指纹）"""
        ua = self.params.get("ua", "")
        
        validation = {
            "name": "UA (设备指纹)",
            "value_preview": ua[:50] + "..." if len(ua) > 50 else ua,
            "length": len(ua),
            "valid": False,
            "level": "error",
            "issues": [],
            "suggestions": []
        }
        
        # 检查是否存在
        if not ua:
            validation["issues"].append("❌ UA 为空")
            validation["suggestions"].append("从浏览器控制台执行: localStorage.getItem('RISK_DEVICE_FINGERPRINT')")
            return validation
        
        # 检查长度
        if len(ua) < 50:
            validation["issues"].append("⚠️  UA 长度过短")
            validation["suggestions"].append("确保提取的是设备指纹而不是简单的 User-Agent")
            validation["level"] = "warning"
        
        # 检查是否是标准 User-Agent
        if ua.startswith("Mozilla/") and len(ua) < 200:
            validation["issues"].append("⚠️  可能是标准 User-Agent 而非设备指纹")
            validation["suggestions"].append("尝试从 localStorage.getItem('RISK_DEVICE_FINGERPRINT') 获取")
            validation["level"] = "warning"
        
        # 检查是否是设备指纹（通常很长）
        if len(ua) > 500:
            validation["valid"] = True
            validation["level"] = "success"
            validation["issues"].append("✅ 设备指纹格式正确")
        elif len(ua) > 100:
            validation["valid"] = True
            validation["level"] = "success"
            validation["issues"].append("✅ UA 格式正确")
        
        return validation
    
    def validate_umid_token(self) -> Dict[str, Any]:
        """验证 umidToken"""
        umid = self.params.get("umidToken", "")
        
        validation = {
            "name": "umidToken (设备令牌)",
            "value_preview": umid[:30] + "..." if len(umid) > 30 else umid,
            "length": len(umid),
            "valid": False,
            "level": "error",
            "issues": [],
            "suggestions": []
        }
        
        # 检查是否存在
        if not umid:
            validation["issues"].append("❌ umidToken 为空")
            validation["suggestions"].append("从浏览器控制台执行: window.AWSC?.umid")
            return validation
        
        # 检查长度
        if len(umid) < 10:
            validation["issues"].append("⚠️  umidToken 长度过短")
            validation["suggestions"].append("确保提取的是完整的 umidToken")
            validation["level"] = "warning"
        
        # 检查格式（通常是长字符串）
        if len(umid) > 20:
            validation["valid"] = True
            validation["level"] = "success"
            validation["issues"].append("✅ umidToken 格式正确")
        
        # 检查是否是十六进制
        if all(c in '0123456789abcdefABCDEF' for c in umid):
            validation["issues"].append("✅ umidToken 格式为十六进制")
        
        return validation
    
    def validate_asac(self) -> Dict[str, Any]:
        """验证 ASAC"""
        asac = self.params.get("asac", "")
        
        validation = {
            "name": "asac (风控参数)",
            "value_preview": asac,
            "length": len(asac),
            "valid": False,
            "level": "warning",
            "issues": [],
            "suggestions": []
        }
        
        # 检查是否存在
        if not asac:
            validation["issues"].append("⚠️  asac 为空")
            validation["suggestions"].append("从浏览器 Network 标签抓包 exchange 请求获取")
            validation["suggestions"].append("URL 参数中的 asac 值")
            return validation
        
        # 检查长度
        if len(asac) < 10:
            validation["issues"].append("⚠️  asac 长度过短")
            validation["level"] = "warning"
        
        # 检查格式（通常是字母数字组合）
        if asac.isalnum() and len(asac) > 15:
            validation["valid"] = True
            validation["level"] = "success"
            validation["issues"].append("✅ asac 格式正确")
        
        return validation
    
    def validate_cookies(self) -> Dict[str, Any]:
        """验证 Cookies"""
        cookies = self.params.get("cookies", {})
        
        required_cookies = ['_m_h5_tk', '_tb_token_']
        recommended_cookies = ['_m_h5_tk_enc', 'cookie2', 'sgcookie']
        
        validation = {
            "name": "Cookies",
            "count": len(cookies),
            "valid": False,
            "level": "warning",
            "issues": [],
            "suggestions": [],
            "details": {}
        }
        
        # 检查必需的 Cookie
        missing_required = []
        for cookie_name in required_cookies:
            if cookie_name in cookies:
                validation["details"][cookie_name] = "✅ 存在"
            else:
                validation["details"][cookie_name] = "❌ 缺失"
                missing_required.append(cookie_name)
        
        # 检查推荐的 Cookie
        for cookie_name in recommended_cookies:
            if cookie_name in cookies:
                validation["details"][cookie_name] = "✅ 存在"
            else:
                validation["details"][cookie_name] = "⚠️  缺失"
        
        # 生成问题和建议
        if missing_required:
            validation["issues"].append(f"❌ 缺少必需的 Cookie: {', '.join(missing_required)}")
            validation["suggestions"].append("从浏览器 Cookie 中提取这些参数")
            validation["level"] = "error"
        else:
            validation["valid"] = True
            validation["level"] = "success"
            validation["issues"].append("✅ 必需的 Cookie 都已配置")
        
        return validation
    
    def validate_all(self) -> Dict[str, Any]:
        """验证所有参数"""
        if not self.load_params():
            return {}
        
        logger.info("=" * 60)
        logger.info("开始验证风控参数")
        logger.info("=" * 60)
        print()
        
        # 验证各个参数
        ua_validation = self.validate_ua()
        umid_validation = self.validate_umid_token()
        asac_validation = self.validate_asac()
        cookies_validation = self.validate_cookies()
        
        # 汇总结果
        self.validation_results = {
            "ua": ua_validation,
            "umidToken": umid_validation,
            "asac": asac_validation,
            "cookies": cookies_validation,
            "overall": self._calculate_overall()
        }
        
        return self.validation_results
    
    def _calculate_overall(self) -> Dict[str, Any]:
        """计算总体验证结果"""
        ua_valid = self.validation_results["ua"]["valid"]
        umid_valid = self.validation_results["umidToken"]["valid"]
        asac_valid = self.validation_results["asac"]["valid"]
        cookies_valid = self.validation_results["cookies"]["valid"]
        
        # 计算完整度
        completeness = (
            (30 if ua_valid else 0) +
            (30 if umid_valid else 0) +
            (20 if asac_valid else 0) +
            (20 if cookies_valid else 0)
        )
        
        # 判断可用性
        # UA 和 umidToken 是必需的
        can_use = ua_valid and umid_valid
        
        # 判断等级
        if completeness >= 80:
            level = "success"
            status = "✅ 优秀"
        elif completeness >= 60:
            level = "success"
            status = "✅ 良好"
        elif completeness >= 40:
            level = "warning"
            status = "⚠️  可用但不完整"
        else:
            level = "error"
            status = "❌ 不可用"
        
        return {
            "completeness": completeness,
            "can_use": can_use,
            "level": level,
            "status": status
        }
    
    def print_report(self):
        """打印验证报告"""
        if not self.validation_results:
            logger.error("没有验证结果")
            return
        
        print()
        print("=" * 60)
        print("📊 验证报告")
        print("=" * 60)
        print()
        
        # 打印各项验证结果
        for key in ["ua", "umidToken", "asac", "cookies"]:
            validation = self.validation_results[key]
            self._print_validation_item(validation)
        
        # 打印总体结果
        print()
        print("=" * 60)
        print("📈 总体评估")
        print("=" * 60)
        overall = self.validation_results["overall"]
        print(f"完整度: {overall['completeness']}%")
        print(f"状态: {overall['status']}")
        print(f"可用性: {'✅ 可以使用' if overall['can_use'] else '❌ 不可使用'}")
        print()
        
        # 打印建议
        self._print_suggestions()
    
    def _print_validation_item(self, validation: Dict[str, Any]):
        """打印单项验证结果"""
        print(f"【{validation['name']}】")
        print(f"  长度: {validation['length']}")
        
        if validation.get('value_preview'):
            print(f"  预览: {validation['value_preview']}")
        
        if validation.get('count') is not None:
            print(f"  数量: {validation['count']}")
        
        # 打印问题
        for issue in validation["issues"]:
            print(f"  {issue}")
        
        # 打印详情（Cookie）
        if validation.get('details'):
            print(f"  详情:")
            for key, value in validation['details'].items():
                print(f"    - {key}: {value}")
        
        print()
    
    def _print_suggestions(self):
        """打印建议"""
        all_suggestions = []
        
        for key in ["ua", "umidToken", "asac", "cookies"]:
            validation = self.validation_results[key]
            if not validation["valid"] and validation["suggestions"]:
                all_suggestions.extend(validation["suggestions"])
        
        if all_suggestions:
            print("=" * 60)
            print("💡 改进建议")
            print("=" * 60)
            for i, suggestion in enumerate(all_suggestions, 1):
                print(f"{i}. {suggestion}")
            print()


def main():
    """主函数"""
    print("=" * 60)
    print("🔍 风控参数验证工具")
    print("=" * 60)
    print()
    
    validator = RiskParameterValidator()
    
    # 验证参数
    results = validator.validate_all()
    
    if results:
        # 打印报告
        validator.print_report()
        
        # 保存验证报告
        report_file = "data/validation_report.json"
        try:
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            logger.success(f"✅ 验证报告已保存到: {report_file}")
        except Exception as e:
            logger.error(f"保存报告失败: {e}")
        
        # 返回退出码
        if results["overall"]["can_use"]:
            sys.exit(0)
        else:
            sys.exit(1)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()

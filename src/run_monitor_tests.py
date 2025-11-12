"""
运行监控系统测试套件
"""
import subprocess
import sys
from pathlib import Path


def run_tests():
    """运行所有测试"""
    print("=" * 80)
    print("开始运行监控系统测试套件")
    print("=" * 80)
    print()
    
    # 测试文件列表
    test_files = [
        "backend/tests/test_websocket_monitor.py",
        "backend/tests/test_monitor_integration.py",
        "backend/tests/test_monitor_performance.py"
    ]
    
    results = {}
    
    for test_file in test_files:
        test_path = Path(test_file)
        
        if not test_path.exists():
            print(f"⚠️  测试文件不存在: {test_file}")
            results[test_file] = "SKIP"
            continue
        
        print(f"\n{'=' * 80}")
        print(f"运行测试: {test_file}")
        print(f"{'=' * 80}\n")
        
        try:
            # 运行pytest
            result = subprocess.run(
                [sys.executable, "-m", "pytest", test_file, "-v", "-s", "--tb=short"],
                capture_output=False,
                text=True
            )
            
            if result.returncode == 0:
                results[test_file] = "PASS"
                print(f"\n✅ {test_file} - 测试通过")
            else:
                results[test_file] = "FAIL"
                print(f"\n❌ {test_file} - 测试失败")
        
        except Exception as e:
            print(f"\n❌ {test_file} - 运行出错: {str(e)}")
            results[test_file] = "ERROR"
    
    # 打印总结
    print("\n" + "=" * 80)
    print("测试总结")
    print("=" * 80)
    
    for test_file, status in results.items():
        status_icon = {
            "PASS": "✅",
            "FAIL": "❌",
            "ERROR": "⚠️",
            "SKIP": "⏭️"
        }.get(status, "❓")
        
        print(f"{status_icon} {test_file}: {status}")
    
    # 统计
    total = len(results)
    passed = sum(1 for s in results.values() if s == "PASS")
    failed = sum(1 for s in results.values() if s == "FAIL")
    errors = sum(1 for s in results.values() if s == "ERROR")
    skipped = sum(1 for s in results.values() if s == "SKIP")
    
    print()
    print(f"总计: {total} | 通过: {passed} | 失败: {failed} | 错误: {errors} | 跳过: {skipped}")
    print("=" * 80)
    
    # 返回状态码
    if failed > 0 or errors > 0:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(run_tests())

import sys
import os
sys.path.append(os.getcwd())
import asyncio
from main import get_plots

async def test():
    try:
        print("Testing get_plots()...")
        res = await get_plots()
        print("Success:", res)
    except Exception as e:
        print("Caught Error:", str(e))
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())

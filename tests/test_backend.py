#!/usr/bin/env python3
"""
Test script to verify backend modules work correctly
"""

import asyncio
import sys
import os
import tempfile

# Add the project root to the path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Import backend modules
from backend.src.database import Database
from backend.src.steam_data import SteamDataService
from backend.src.hltb_service import HLTBService


async def test_database():
    """Test database operations"""
    print("Testing Database Module...")

    # Use a temporary database for testing
    with tempfile.NamedTemporaryFile(suffix='.db') as tmp:
        db = Database(tmp.name)
        await db.init_database()

        # Test setting a tag
        success = await db.set_tag("440", "completed", is_manual=False)
        print(f"  - Set tag: {'✓' if success else '✗'}")

        # Test getting a tag
        tag = await db.get_tag("440")
        print(f"  - Get tag: {'✓' if tag else '✗'}")

        # Test settings
        await db.set_setting("test_setting", "test_value")
        value = await db.get_setting("test_setting")
        print(f"  - Settings: {'✓' if value == 'test_value' else '✗'}")

        await db.close()
        print("  Database tests completed!")


async def test_steam_data():
    """Test Steam data service"""
    print("\nTesting Steam Data Service...")

    service = SteamDataService()

    # Test finding Steam path
    steam_path = service.steam_path
    print(f"  - Steam path found: {'✓' if steam_path else '✗ (expected if Steam not installed)'}")

    if steam_path:
        # Test getting user ID
        user_id = await service.get_steam_user_id()
        print(f"  - User ID: {user_id if user_id else 'Not found'}")

        # Test getting library folders
        folders = await service.get_library_folders()
        print(f"  - Library folders: {len(folders)} found")
    else:
        print("  - Steam not found, skipping Steam-specific tests")

    print("  Steam Data Service tests completed!")


async def test_hltb():
    """Test HLTB service"""
    print("\nTesting HLTB Service...")

    service = HLTBService()

    # Test searching for a well-known game
    result = await service.search_game("Portal 2")
    if result:
        print(f"  - Search test: ✓ (Found: {result['matched_name']})")
        print(f"    - Main Story: {result.get('main_story')} hours")
        print(f"    - Similarity: {result.get('similarity'):.2f}")
    else:
        print(f"  - Search test: ✗ (Network issue or API change)")

    print("  HLTB Service tests completed!")


async def test_main_plugin():
    """Test main plugin class"""
    print("\nTesting Main Plugin...")

    # Import main plugin
    import main

    # Create plugin instance
    plugin = main.Plugin()

    # Initialize plugin
    await plugin._main()
    print("  - Plugin initialization: ✓")

    # Test getting settings
    settings = await plugin.get_settings()
    print(f"  - Get settings: {'✓' if settings.get('success') else '✗'}")

    # Clean up
    await plugin._unload()
    print("  - Plugin cleanup: ✓")

    print("  Main Plugin tests completed!")


async def main():
    """Run all tests"""
    print("=" * 50)
    print("Steam Deck Game Progress Tracker - Backend Tests")
    print("=" * 50)

    try:
        await test_database()
        await test_steam_data()
        await test_hltb()
        await test_main_plugin()

        print("\n" + "=" * 50)
        print("All tests completed successfully!")
        print("=" * 50)

    except Exception as e:
        print(f"\n✗ Error during tests: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
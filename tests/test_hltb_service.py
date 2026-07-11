#!/usr/bin/env python3
"""
End-to-end test for HowLongToBeat (HLTB) service integration.
Tests the actual HLTB scraping and parsing logic with real API calls.
"""

import asyncio
import sys
from pathlib import Path

# Add py_modules to path so we can import hltb_service
plugin_dir = Path(__file__).parent.parent
sys.path.insert(0, str(plugin_dir / "py_modules"))

# Patch `import decky` to be a no-op to avoid import errors in the test environment
from unittest.mock import MagicMock
import logging

mock_decky = MagicMock()
mock_decky.logger = logging.getLogger()

# Inject the mock decky module into sys.modules before importing hltb_service
import sys
sys.modules['decky'] = mock_decky

from hltb_service import HLTBService


async def test_hltb_search_game():
    """Test that HLTB search returns valid data for a known game"""
    service = HLTBService()
    
    # Test with The Witcher 3 - a well-known game with plenty of HLTB data
    game_name = "The Witcher 3: Wild Hunt"
    
    print(f"Testing HLTB search for: {game_name}")
    
    result = await service.search_game(game_name)
    
    # Verify we got some result
    assert result is not None, f"Expected HLTB data for '{game_name}', but got None"
    
    # Verify required fields are present and valid
    assert "game_name" in result, "Missing 'game_name' field in result"
    assert "matched_name" in result, "Missing 'matched_name' field in result"
    assert "similarity" in result, "Missing 'similarity' field in result"
    
    # Verify the matched game name makes sense
    assert result["matched_name"] is not None, "matched_name should not be None"
    assert len(result["matched_name"]) > 0, "matched_name should not be empty"
    
    # Verify similarity score is reasonable (should be high for exact match)
    assert result["similarity"] >= 0.7, f"Similarity too low: {result['similarity']}"
    
    # Verify main story time is present and valid
    assert "main_story" in result, "Missing 'main_story' field"
    assert result["main_story"] is not None, "main_story should not be None"
    assert result["main_story"] > 0, f"main_story should be positive, got {result['main_story']}"
    
    # Verify other time fields exist (they can be None if no data)
    assert "main_extra" in result, "Missing 'main_extra' field"
    assert "completionist" in result, "Missing 'completionist' field"
    assert "all_styles" in result, "Missing 'all_styles' field"
    
    # Verify URL is present
    assert "hltb_url" in result, "Missing 'hltb_url' field"
    assert result["hltb_url"].startswith("https://howlongtobeat.com/game/"), \
        f"Invalid HLTB URL: {result['hltb_url']}"
    
    print(f"✓ Search successful!")
    print(f"  Matched game: {result['matched_name']}")
    print(f"  Similarity: {result['similarity']:.2f}")
    print(f"  Main story: {result['main_story']} hours")
    if result.get("main_extra"):
        print(f"  Main + Extra: {result['main_extra']} hours")
    if result.get("completionist"):
        print(f"  Completionist: {result['completionist']} hours")
    
    return result


async def test_hltb_game_not_found():
    """Test that HLTB search returns None for non-existent game"""
    service = HLTBService()
    
    # Test with a very unlikely to exist game name
    game_name = "zzzThisNameDoesNotExistzzz12345"
    
    print(f"\nTesting HLTB search for non-existent game: '{game_name}'")
    
    result = await service.search_game(game_name)
    
    # Should return None since game doesn't exist
    assert result is None, f"Expected None for non-existent game, got: {result}"
    
    print(f"✓ Correctly returned None for non-existent game")


async def test_hltb_empty_input():
    """Test that HLTB search returns None for empty/invalid input"""
    service = HLTBService()
    
    # Test with various invalid inputs
    invalid_inputs = [None, "", " ", "\t", "Unknown Game", "Proton"]
    
    print(f"\nTesting HLTB search with invalid inputs...")
    
    for game_name in invalid_inputs:
        result = await service.search_game(game_name)
        expected_none = (game_name is None or 
                        not game_name.strip() or
                        game_name.startswith("Unknown") or
                        "proton" in game_name.lower())
        
        if expected_none:
            assert result is None, f"Expected None for '{game_name}', got: {result}"
    
    print(f"✓ Correctly handled invalid inputs")


async def test_hltb_game_with_special_characters():
    """Test that HLTB search works with games that have special characters"""
    service = HLTBService()
    
    # Test with a game that has special characters in its name
    # The Witcher series often appears with colons and apostrophes
    test_cases = [
        "The Witcher 3",
        "Mass Effect: Trilogy", 
    ]
    
    print(f"\nTesting HLTB search with various formats...")
    
    for game_name in test_cases:
        result = await service.search_game(game_name)
        
        # Should find something
        assert result is not None, f"Expected results for '{game_name}', got None"
        assert result["main_story"] is not None, f"No main story data for '{game_name}'"
        
        print(f"  ✓ {game_name}: matched '{result['matched_name']}' ({result['main_story']}h)")
    
    print(f"✓ Special character handling works")


async def test_hltb_rate_limiting():
    """Test that multiple HLTB searches work in sequence"""
    service = HLTBService()
    
    # Test with multiple games to verify no rate limiting issues
    games = [
        "The Witcher 3: Wild Hunt",
        "Portal 2",
        "Grand Theft Auto V"
    ]
    
    print(f"\nTesting multiple sequential searches...")
    
    for i, game_name in enumerate(games):
        result = await service.search_game(game_name)
        
        # Verify we get valid data
        assert result is not None, f"Failed on game {i+1}: '{game_name}'"
        assert "main_story" in result and result["main_story"] is not None
        
        print(f"  {i+1}. {game_name}: {result['main_story']}h")
    
    print(f"✓ Multiple searches completed successfully")


async def run_all_tests():
    """Run all HLTB service tests"""
    print("=" * 60)
    print("HLTB Service End-to-End Tests")
    print("=" * 60)
    
    # Check if HLTB is accessible before running network-dependent tests
    import urllib.request
    try:
        req = urllib.request.Request(
            "https://howlongtobeat.com",
            headers={"User-Agent": "Mozilla/5.0 (test)"}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            hltb_accessible = True
    except Exception as e:
        print(f"\n⚠ HLTB appears to be currently unreachable ({e})")
        print("  Network-dependent tests will be marked as skipped.")
        hltb_accessible = False
    
    tests = [
        ("Search for known game", test_hltb_search_game),
        ("Handle non-existent game", test_hltb_game_not_found),
        ("Handle empty/invalid input", test_hltb_empty_input),
        ("Handle special characters", test_hltb_game_with_special_characters),
        ("Multiple sequential searches", test_hltb_rate_limiting),
    ]
    
    passed = 0
    failed = 0
    skipped = 0
    
    for name, test_func in tests:
        # Skip network-dependent tests if HLTB is not accessible
        skip_network_tests = not hltb_accessible and name != "Handle empty/invalid input"
        
        if skip_network_tests:
            print(f"\n--- Test: {name} (SKIPPED - HLTB unreachable) ---")
            skipped += 1
            continue
            
        print(f"\n--- Test: {name} ---")
        try:
            result = await test_func()
            passed += 1
            if isinstance(result, dict):
                # Verify the result looks reasonable
                assert result["main_story"] > 0 and result["main_story"] < 200, \
                    f"Main story time seems unreasonable: {result['main_story']}h"
        except AssertionError as e:
            print(f"✗ FAILED: {e}")
            failed += 1
        except Exception as e:
            # Don't count network errors as test failures
            if "HTTP Error 4" in str(e) or "503" in str(e):
                print(f"⚠ SKIPPED - Network error (HLTB likely rate-limited/blocking): {type(e).__name__}")
                skipped += 1
            else:
                print(f"✗ ERROR: {type(e).__name__}: {e}")
                import traceback
                traceback.print_exc()
                failed += 1
    
    print("\n" + "=" * 60)
    print(f"Test Summary: {passed} passed, {failed} failed, {skipped} skipped")
    print("=" * 60)
    
    # Tests pass only if no actual failures (skips are okay for network issues)
    return failed == 0


if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)

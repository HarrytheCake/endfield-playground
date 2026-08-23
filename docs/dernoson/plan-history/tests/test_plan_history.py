"""The plan-history record checks itself.

`0009` verified this machinery by hand — seven throwaway fixtures, eight situations, all
confirmed — and left nothing behind, so the verification expired when that session ended
(`0011` O11). These tests are that verification made permanent.

Two rules shape what is here:

* **Every check gets a defect that must fire it AND a repair that must silence it.** A
  fixture that only asserts the quiet case cannot tell a working check from a check that
  never runs — which is exactly how the `basis` parser shipped counting one observation
  out of three (`0011` O13).
* **The real corpus is a fixture too.** `test_the_committed_corpus_is_clean` turns
  "`update-head.py` reports nothing" from a habit into a gate.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import pytest

PLAN_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PLAN_DIR))

import plan_parse  # noqa: E402

OBS = "### O1 · 2026-01-01 00:00:00+08:00 — a\n\nfact.\n"
OBS_NAIVE = "### O1 · 2026-01-01 00:00:00 — a\n\nfact.\n"  # pre-v3 stamps carry no zone
ITEM = "### 1 一格\n\n- **state:** 待實作\n\n正文。\n"


def v3(name: str, *, items: str = ITEM, obs: str = OBS, summary: str = "t", status: str = "draft") -> str:
    return (
        f"# {name}\n\n- **prev:** —\n- **skill:** plan-history v3\n- **status:** {status}\n\n"
        f"## 主題簡述\n\n{summary}\n\n## 觀察與推論\n\n{obs}\n## 待辦\n\n{items}"
    )


def v2(name: str, *, items: str = "- [ ] a → O1\n", obs: str = OBS_NAIVE, status: str = "draft") -> str:
    return (
        f"# {name}\n\n- **prev:** —\n- **skill:** plan-history v2\n- **status:** {status}\n\n"
        f"## 主題簡述\n\nt\n\n## 觀察與推論\n\n{obs}\n## 待決斷/待完成事項\n\n{items}"
    )


def codes(tmp_path: Path, **files: str) -> list[str]:
    """Write a corpus and return the conflict codes it produces."""
    for stem, body in files.items():
        (tmp_path / f"{stem}.md").write_text(body, encoding="utf-8")
    return [c.code for c in plan_parse.collect(tmp_path).conflicts]


# --------------------------------------------------------------------------- v3 checks
# Each case: the defect that must be reported, and the repair that must not be.


def test_an_item_without_a_state_is_reported(tmp_path):
    name = "0100_20260101_a"
    broken = v3(name, items="### 1 沒有 state\n\n正文。\n")
    assert "BAD_ITEM_FORMAT" in codes(tmp_path, **{name: broken})
    assert "BAD_ITEM_FORMAT" not in codes(tmp_path, **{name: v3(name)})


@pytest.mark.parametrize(
    "items",
    [
        "### 1 x\n\n- **state:** 快好了\n\n正文。\n",  # state outside the vocabulary
        "### 沒編號\n\n- **state:** 待實作\n\n正文。\n",  # heading is not `### <n> 標題`
        "### 1 x\n\n- **state:** 待實作\n\n### 1 y\n\n- **state:** 待實作\n",  # id reused
        "### 1 x\n\n- **state:** 移交\n\n正文。\n",  # 移交 with no target
    ],
)
def test_malformed_items_are_reported(tmp_path, items):
    assert "BAD_ITEM_FORMAT" in codes(tmp_path, **{"0100_20260101_a": v3("0100_20260101_a", items=items)})


@pytest.mark.parametrize(
    ("entry", "fires"),
    [
        ("- H1 · 2026-01-01 落地 —— 正常\n", False),
        ("- 2026-01-01 落地 —— 少了 H 編號\n", True),
        ("- H1 · 2026-01-01 亂寫 —— kind 不在表裡\n", True),
        ("- H1 · 2026-01-01 落地 —— a\n- H1 · 2026-01-01 決斷 —— H 重號\n", True),
    ],
)
def test_history_lines_must_match_the_grammar(tmp_path, entry, fires):
    items = f"### 1 x\n\n- **state:** 待實作\n\n正文。\n\n**沿革**\n\n{entry}"
    got = codes(tmp_path, **{"0100_20260101_a": v3("0100_20260101_a", items=items)})
    assert ("BAD_ITEM_FORMAT" in got) is fires


@pytest.mark.parametrize(
    ("target", "says"),
    [
        ("0100#1", None),  # resolves — nothing to report
        ("0100#9", "no such item"),
        ("9999#1", "does not exist"),
        ("0200#1", "is not v3"),  # the plan exists but has no addressable items
    ],
)
def test_a_reference_must_resolve_to_a_real_v3_item(tmp_path, target, says):
    """The message is asserted, not just the code.

    "that plan is not v3" tells the reader what to do; "no such item" sends them
    hunting for a typo that is not there.
    """
    items = f"### 1 x\n\n- **state:** 待實作\n\n### 2 y\n\n- **state:** 待實作\n- **needs:** {target}\n"
    for stem, body in {
        "0100_20260101_a": v3("0100_20260101_a", items=items),
        "0200_20260101_b": v2("0200_20260101_b"),
    }.items():
        (tmp_path / f"{stem}.md").write_text(body, encoding="utf-8")
    dangling = [c for c in plan_parse.collect(tmp_path).conflicts if c.code == "DANGLING_REF"]
    if says is None:
        assert dangling == []
    else:
        assert len(dangling) == 1 and says in dangling[0].detail


def test_an_address_in_prose_is_checked_like_any_other(tmp_path):
    """The references nothing could check before are the ones that go stale silently."""
    items = "### 1 x\n\n- **state:** 待實作\n\n正文提到 0100#7 這一格。\n"
    assert "DANGLING_REF" in codes(tmp_path, **{"0100_20260101_a": v3("0100_20260101_a", items=items)})


A, B = "0100_20260101_a", "0200_20260101_b"
HANDS_OFF = "### 1 x\n\n- **state:** 移交\n- **移交:** 0200#1\n\n正文。\n"
HOLDS_NOTHING = "### 1 y\n\n- **state:** 待實作\n\n正文。\n"
ACKNOWLEDGES = "### 1 y\n\n- **state:** 待實作\n- **承接:** 0100#1\n\n正文。\n"


def test_a_handoff_the_target_never_acknowledged_is_reported(tmp_path):
    """One-sided handoff is how an obligation evaporates between two files: both ends
    stay individually legal, and nothing is left holding the work (`0011` O5)."""
    got = codes(tmp_path, **{A: v3(A, items=HANDS_OFF), B: v3(B, items=HOLDS_NOTHING)})
    assert "UNCLAIMED_HANDOFF" in got

    fixed = codes(tmp_path, **{A: v3(A, items=HANDS_OFF), B: v3(B, items=ACKNOWLEDGES)})
    assert "UNCLAIMED_HANDOFF" not in fixed


def test_a_claim_that_nobody_handed_over_is_reported(tmp_path):
    got = codes(tmp_path, **{A: v3(A, items=HOLDS_NOTHING.replace("y", "x")), B: v3(B, items=ACKNOWLEDGES)})
    assert "ORPHAN_CLAIM" in got

    fixed = codes(tmp_path, **{A: v3(A, items=HANDS_OFF), B: v3(B, items=ACKNOWLEDGES)})
    assert "ORPHAN_CLAIM" not in fixed


@pytest.mark.parametrize(
    ("needs", "fires"),
    [("### 1 x\n\n- **state:** 待實作\n- **needs:** 0100#2\n\n### 2 y\n\n- **state:** 待實作\n", False),
     ("### 1 x\n\n- **state:** 待實作\n- **needs:** 0100#2\n\n### 2 y\n\n- **state:** 待實作\n- **needs:** 0100#1\n", True),
     ("### 1 x\n\n- **state:** 待實作\n- **needs:** 0100#1\n", True)],  # self-cycle
)
def test_a_dependency_cycle_is_reported(tmp_path, needs, fires):
    got = codes(tmp_path, **{"0100_20260101_a": v3("0100_20260101_a", items=needs)})
    assert ("CYCLIC_NEEDS" in got) is fires


def test_basis_counts_every_observation_behind_the_one_arrow(tmp_path):
    """Regression for `0011` O13.

    `→ O1、O2、O3、O4` is one arrow and four citations. Counting only the first left
    the rest invisible to every reader — and no existing check could see it, because
    the arrow still resolved and the numbers still added up.
    """
    obs = "".join(f"### O{i} · 2026-01-01 00:00:0{i}+08:00 — o{i}\n\nfact.\n\n" for i in range(1, 5))
    items = "### 1 x\n\n- **state:** 待實作\n- **basis:** → O1、O2、O3、O4\n\n正文。\n"
    name = "0100_20260101_a"
    (tmp_path / f"{name}.md").write_text(v3(name, items=items, obs=obs), encoding="utf-8")
    item = plan_parse.collect(tmp_path).plans[0].items[0]
    assert item.basis == [1, 2, 3, 4]


def test_a_v3_observation_must_say_which_clock_it_was_read_from(tmp_path):
    """A bare stamp is ambiguous, and the plans that carry one were all written on a
    UTC machine while the reader is in Taipei — eight hours of silent drift."""
    name = "0100_20260101_a"
    assert "BAD_FORMAT" in codes(tmp_path, **{name: v3(name, obs=OBS_NAIVE)})
    assert "BAD_FORMAT" not in codes(tmp_path, **{name: v3(name, obs=OBS)})
    # Non-retroactive: the same bare stamp in a v2 plan is still correct.
    assert codes(tmp_path, **{"0200_20260101_b": v2("0200_20260101_b")}) == []


def test_observations_are_ordered_by_the_moment_not_the_string(tmp_path):
    """A file may hold both stamp forms — `0011` itself does — so ordering compares
    instants.

    Both cases below are ones where the two comparisons **disagree**, which is the only
    kind that proves anything: `2026-01-02 01:00+08:00` is 2026-01-01 17:00 UTC, so it
    sorts *after* `2026-01-01 20:00` by string and *before* it by moment.
    """
    name = "0100_20260101_a"
    looks_forward_but_goes_back = (
        "### O1 · 2026-01-01 20:00:00 — utc 20:00\n\nf.\n\n"
        "### O2 · 2026-01-02 01:00:00+08:00 — 其實是 utc 17:00,更早\n\nf.\n"
    )
    looks_backward_but_goes_forward = (
        "### O1 · 2026-01-02 01:00:00+08:00 — utc 17:00\n\nf.\n\n"
        "### O2 · 2026-01-01 20:00:00 — utc 20:00,更晚\n\nf.\n"
    )
    assert "OBS_OUT_OF_ORDER" in codes(tmp_path, **{name: v2(name, obs=looks_forward_but_goes_back)})
    assert "OBS_OUT_OF_ORDER" not in codes(tmp_path, **{name: v2(name, obs=looks_backward_but_goes_forward)})


TWO_OBS = (
    "### O1 · 2026-01-01 00:00:00+08:00 — 原始事實\n\nf.\n\n"
    "### O2 · 2026-01-01 01:00:00+08:00 — 後來的觀察\n\n- **{kind}:** O1\n\nf.\n"
)


@pytest.mark.parametrize(("kind", "fires"), [("更正", True), ("推翻", False), ("更新", False)])
def test_only_a_corrected_fact_makes_a_basis_stale(tmp_path, kind, fires):
    """One word did all three jobs through v2 (`0011` O18), and only one of them means
    the work already built on the observation is wrong. 推翻 leaves the fact citable;
    更新 leaves both true, each for its own moment."""
    items = "### 1 x\n\n- **state:** 待實作\n- **basis:** → O1\n\n正文。\n"
    name = "0100_20260101_a"
    got = codes(tmp_path, **{name: v3(name, items=items, obs=TWO_OBS.format(kind=kind))})
    assert ("STALE_BASIS" in got) is fires


def test_re_pointing_the_basis_clears_it(tmp_path):
    items = "### 1 x\n\n- **state:** 待實作\n- **basis:** → O2\n\n正文。\n"
    name = "0100_20260101_a"
    assert "STALE_BASIS" not in codes(tmp_path, **{name: v3(name, items=items, obs=TWO_OBS.format(kind="更正"))})


def test_history_may_cite_an_observation_that_was_later_corrected(tmp_path):
    """沿革 records what we believed then. Citing a since-corrected observation there is
    a true historical record, not a defect — only `basis` claims to be current."""
    items = (
        "### 1 x\n\n- **state:** 待實作\n- **basis:** → O2\n\n正文。\n\n"
        "**沿革**\n\n- H1 · 2026-01-01 落地 —— 當時是照這條做的 → O1\n"
    )
    name = "0100_20260101_a"
    assert "STALE_BASIS" not in codes(tmp_path, **{name: v3(name, items=items, obs=TWO_OBS.format(kind="更正"))})


def test_an_observation_that_is_cited_but_undefined_is_reported(tmp_path):
    items = "### 1 x\n\n- **state:** 待實作\n- **basis:** → O9\n\n正文。\n"
    assert "BROKEN_OBS_REF" in codes(tmp_path, **{"0100_20260101_a": v3("0100_20260101_a", items=items)})


# ------------------------------------------------------------------------- v3 warnings


def test_a_plan_nobody_can_move_is_flagged_but_does_not_fail(tmp_path):
    items = (
        "### 1 等使用者\n\n- **state:** 待決斷\n\n正文。\n"
        "### 2 被擋住\n\n- **state:** 待實作\n- **needs:** 0100#1\n\n正文。\n"
    )
    name = "0100_20260101_a"
    (tmp_path / f"{name}.md").write_text(v3(name, items=items, status="in-progress"), encoding="utf-8")
    report = plan_parse.collect(tmp_path)
    assert [c.code for c in report.warnings] == ["STARVED"]
    assert report.errors == []

    # One item the agent can start, and the plan is no longer starved.
    freed = items.replace("- **state:** 待實作\n- **needs:** 0100#1", "- **state:** 待實作")
    (tmp_path / f"{name}.md").write_text(v3(name, items=freed, status="in-progress"), encoding="utf-8")
    assert plan_parse.collect(tmp_path).warnings == []


def test_an_item_trips_overgrown_only_on_two_signals(tmp_path):
    obs = "".join(f"### O{i} · 2026-01-01 00:00:0{i}+08:00 — o{i}\n\nfact.\n\n" for i in range(1, 5))
    long_body = "\n".join(f"第 {i} 行。" for i in range(1, 17))
    name = "0100_20260101_a"

    def warnings_for(body: str) -> list[str]:
        items = f"### 1 x\n\n- **state:** 待實作\n- **basis:** → O1、O2、O3、O4\n\n{body}\n"
        (tmp_path / f"{name}.md").write_text(v3(name, items=items, obs=obs), encoding="utf-8")
        return [c.code for c in plan_parse.collect(tmp_path).warnings]

    assert warnings_for(long_body) == ["OVERGROWN"]  # basis 4 + 正文 16 行
    assert warnings_for("一行正文。") == []  # basis 4 alone is one signal


def test_a_header_over_the_cap_is_flagged(tmp_path):
    name = "0100_20260101_a"

    def warnings_for(n: int) -> list[str]:
        summary = "\n".join(f"第 {i} 行。" for i in range(1, n + 1))
        (tmp_path / f"{name}.md").write_text(v3(name, summary=summary), encoding="utf-8")
        return [c.code for c in plan_parse.collect(tmp_path).warnings]

    assert warnings_for(plan_parse.SUMMARY_MAX_LINES) == []
    assert warnings_for(plan_parse.SUMMARY_MAX_LINES + 1) == ["HEADER_TOO_LONG"]


# ------------------------------------------------------- v1 / v2 are not touched by v3


def test_older_plans_report_nothing_at_all(tmp_path):
    """Non-retroactivity is the rule the whole versioning scheme rests on.

    Asserting only that the v3 *codes* stay away is too weak: applying a v3 rule to a
    v2 file mostly surfaces as an old code (`BAD_FORMAT`, for a `## 待辦` that a v2
    plan was never supposed to have). A clean older plan must be silent, full stop.
    """
    v1 = (
        "# 0100_20260101_a\n\n- **prev:** —\n- **status:** draft\n\n"
        "## 主題簡述\n\nt\n\n## 待決斷/待完成事項\n\n- [x] a\n"
    )
    assert codes(tmp_path, **{"0100_20260101_a": v1, "0200_20260101_b": v2("0200_20260101_b")}) == []


# ------------------------------------------------------------------------ the CLI tools


def run(script: str, *args: str, root: Path) -> subprocess.CompletedProcess[str]:
    """Invoke a CLI and decode it as UTF-8, which is what it promises to emit.

    `text=True` alone decodes with the locale codec, and on a zh-TW Windows box that
    is cp950 — every assertion below would be reading a different string than the one
    the tool wrote. The CLIs pin their streams to UTF-8 (`force_utf8_stdio`), so the
    reader has to say so too.
    """
    env = {**os.environ, "PLAN_HISTORY_ROOT": str(root)}
    return subprocess.run(
        [sys.executable, str(PLAN_DIR / script), *args],
        capture_output=True, text=True, encoding="utf-8", env=env,
    )


@pytest.fixture
def corpus(tmp_path: Path) -> Path:
    obs = (
        "### O1 · 2026-01-01 09:00:00+08:00 — 事實一\n\n第一條的內文。\n\n"
        "### O2 · 2026-01-01 10:00:00+08:00 — 事實二\n\n第二條的內文。\n\n"
        "### O3 · 2026-01-01 11:00:00+08:00 — 事實三\n\n- **推翻:** O2\n- **更新:** O1\n\n第三條的內文。\n"
    )
    items = (
        "### 1 有依據也有沿革\n\n- **state:** 待實作\n- **basis:** → O1、O3\n\n"
        "這是正文。\n\n**沿革**\n\n"
        "- H1 · 2026-01-01 決斷 —— 最初的決定（使用者）\n"
        "- H2 · 2026-01-01 落地 —— 做完了 → O2\n"
        "- H3 · 2026-01-01 修正 —— 依據換了（取代 H1）→ O3\n\n"
        "### 2 已經做完\n\n- **state:** 完成\n\n正文。\n"
    )
    name = "0300_20260101_demo"
    body = v3(name, items=items, obs=obs, status="in-progress")
    (tmp_path / f"{name}.md").write_text(
        body.replace("## 觀察與推論", "## 規劃描述\n\n這一段不該出現在逐格輸出裡。\n\n## 觀察與推論"),
        encoding="utf-8",
    )
    (tmp_path / "0200_20260101_old.md").write_text(v2("0200_20260101_old"), encoding="utf-8")
    return tmp_path


def test_the_default_view_is_the_present_and_nothing_else(corpus):
    out = run("plan-item.py", "0300#1", root=corpus).stdout
    assert "這是正文。" in out
    assert "第一條的內文。" in out and "第三條的內文。" in out  # basis, in full
    assert "這一段不該出現在逐格輸出裡" not in out  # 規劃描述 stays out
    # The whole 沿革 section stays out — asserting only that the superseded entry is
    # absent would still pass if the view printed every entry that still holds.
    assert "## 沿革" not in out
    assert "最初的決定" not in out and "做完了" not in out
    assert "第二條的內文。" not in out  # O2 is overturned and not in basis
    assert "沿革 3 條未顯示" in out  # but the reader is told it exists


def test_there_is_no_filtered_middle_view(corpus):
    """`--why` was removed (`0011` O16).

    It filtered a healthy item's eight-line 沿革 down to six, which is not the scarce
    dimension, and it was the one behaviour in v3 that depended on an unenforceable
    convention. Removing a flag has to be visible: the old command must fail, not
    quietly turn into something else.
    """
    proc = run("plan-item.py", "0300#1", "--why", root=corpus)
    assert proc.returncode == 2
    assert "不認得的選項" in proc.stderr


def test_history_shows_everything_and_marks_what_no_longer_holds(corpus):
    out = run("plan-item.py", "0300#1", "--history", root=corpus).stdout
    assert "最初的決定" in out and "已被取代" in out
    assert "第二條的內文。" in out and "推論已被 O3 推翻" in out


def test_each_relation_is_marked_in_its_own_words(corpus):
    """The three relations ask the reader for different things, so they must not print
    the same sentence: one says stop citing this, one says re-check the conclusion, one
    says nothing is wrong, time moved."""
    out = run("plan-item.py", "0300#1", "--history", root=corpus).stdout
    assert "已由 O3 更新" in out  # O1, still true for its own moment
    assert "推論已被 O3 推翻" in out  # O2, its fact survives
    assert "不可再引用" not in out  # nothing here was 更正'd


def test_list_shows_open_items_and_skips_closed_ones(corpus):
    out = run("plan-item.py", "--list", root=corpus).stdout
    assert "0300#1" in out
    assert "0300#2" not in out  # 完成 is terminal


@pytest.mark.parametrize(
    ("args", "expect"),
    [
        (["0300#9"], "沒有第 9 格"),
        (["0200#1"], "v2"),  # a v2 plan has no addressable items
        (["9999#1"], "沒有 seq"),
        (["0300-1"], "不是一個位址"),
        ([], "用法"),
        (["0300#1", "--nope"], "不認得的選項"),
    ],
)
def test_a_request_it_cannot_answer_fails_loudly(corpus, args, expect):
    """v3-only is a refusal, not a degraded answer: a partial answer about a plan is
    worse than none, because the reader cannot tell which part is missing."""
    proc = run("plan-item.py", *args, root=corpus)
    assert proc.returncode == 2
    assert expect in proc.stderr


def test_head_md_lists_items_and_says_why_older_plans_are_absent(corpus):
    assert run("update-head.py", root=corpus).returncode == 0
    head = (corpus / "head.md").read_text(encoding="utf-8")
    assert "- `0300#1`" in head and "0300#2" not in head
    assert "plan-item.py 0300#1" in head  # the copy-pasteable way in
    assert "0200" in head and "只能開檔" in head


def test_a_blocked_item_says_what_it_is_waiting_for(tmp_path):
    items = (
        "### 1 等別人\n\n- **state:** 待實作\n- **needs:** 0100#2\n\n正文。\n"
        "### 2 前置\n\n- **state:** 待決斷\n\n正文。\n"
    )
    name = "0100_20260101_a"
    (tmp_path / f"{name}.md").write_text(v3(name, items=items, status="in-progress"), encoding="utf-8")
    out = run("plan-item.py", "--list", root=tmp_path).stdout
    assert "阻塞" in out and "等 0100#2" in out


# ------------------------------------------------------------------- the real corpus


def test_the_committed_corpus_is_clean():
    """What `update-head.py` reports by hand, CI now reports on its own."""
    report = plan_parse.collect(PLAN_DIR)
    assert report.errors == [], plan_parse.format_conflicts(report.errors)
    if not report.plans:
        pytest.skip(f"no plan files in {PLAN_DIR} yet — nothing to check against")


def test_head_md_is_up_to_date():
    """`head.md` is generated; a stale one is a lie told by a file nobody edits."""
    assert run("update-head.py", "--check", root=PLAN_DIR).returncode == 0
    before = (PLAN_DIR / "head.md").read_text(encoding="utf-8")
    assert run("update-head.py", root=PLAN_DIR).returncode == 0
    assert (PLAN_DIR / "head.md").read_text(encoding="utf-8") == before

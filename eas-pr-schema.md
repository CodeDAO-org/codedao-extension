# 🛡️ EAS Schema for PR Attestations

## Schema Definition

**Schema UID**: `0x...` (to be generated on Base)

**Schema**: 
```
string repo_name,
uint256 pr_number,
address author_addr,
address merged_by,
uint256 lines_added,
uint256 lines_removed,
uint256 files_changed,
string[] labels,
bool tests_passed,
uint256 complexity_score,
uint256 review_approvals,
uint256 merged_timestamp
```

## Usage

Each merged PR gets an on-chain attestation with this schema, enabling:

1. **Proof of Contribution**: Immutable record of developer contributions
2. **Quality Scoring**: Algorithmic scoring based on multiple factors
3. **Reward Distribution**: Weekly epoch rewards based on attestation data
4. **Reputation Building**: Long-term developer reputation system

## Attestation Process

1. **GitHub App** monitors allowlisted repos for PR merges
2. **Quality Score** calculated based on:
   - Base points for merged PR
   - Difficulty multiplier (labels: `good-first-issue`, `core`, etc.)
   - Review factor (number of approvals)
   - Test coverage (added tests)
   - Complexity (cyclomatic complexity, files changed)
   - Author reputation multiplier

3. **Attestation Created** on Base with all PR metadata
4. **Epoch Calculation** reads attestations to generate reward Merkle tree

## Anti-Gaming Measures

- ✅ Only **merged** PRs in allowlisted repos
- ✅ Ignore trivial changes (formatting, renames)
- ✅ Rate limiting per contributor per epoch
- ✅ DAO can nullify fraudulent attestations
- ✅ GitHub OAuth + Gitcoin Passport for sybil resistance

## Example Attestation

```json
{
  "repo_name": "codedao-org/codedao-extension",
  "pr_number": 42,
  "author_addr": "0x1234567890123456789012345678901234567890",
  "merged_by": "0x0987654321098765432109876543210987654321",
  "lines_added": 156,
  "lines_removed": 23,
  "files_changed": 8,
  "labels": ["feature", "high-priority"],
  "tests_passed": true,
  "complexity_score": 85,
  "review_approvals": 3,
  "merged_timestamp": 1704067200
}
```

## Integration Points

- **GitHub App**: Creates attestations on PR merge
- **Epoch Distributor**: Reads attestations for reward calculation
- **Dashboard**: Shows contributor attestations and scores
- **Reputation System**: Builds long-term contributor scores 
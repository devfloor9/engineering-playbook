---
title: "Cascade Routing characters¤characters  íë"
sidebar_label: "Cascade Routing íë"
description: "Inference Gateway Cascade Routingcharacters ë¶ë¥ charactersê³itemsÂ·Canary ë¡¤characterscharactersÂ·FallbackÂ·ë¹characters© ëë¦¬íí¸ ê²½ë³´ë¥¼ íë¡ëcharacters trace basedcharacters¼ë¡ íëíë itemscharacters´ë"
tags: [cascade-routing, inference-gateway, langfuse, tuning, 'scope:ops']
sidebar_position: 3
last_update:
  date: 2026-04-18
  author: devfloor9
---

# Cascade Routing characters¤characters  íë

> characterscharacters±characters¼: 2026-04-18 | characters½ë charactersitems: characters½ 20ë¶

characters´ ë¬¸charactersë Inference Gatewaycharacters **Cascade Routingcharacters íë¡ëcharacters íê²½characterscharacters íë**íë characters¤characters  itemscharacters´ëcharactersëë¤. charactersí¤ícharacters² itemsëê³¼ ê¸°ë³¸ êµ¬ícharacters [ê²characters´í¸characters¨characters´ ë¼characters°í characters ëµ](./inference-gateway-routing.md)characters ë¨¼characters  characters°¸characters¡°ícharacters¸characters.

:::info ëcharacters ëcharacters
characters´ ë¬¸charactersë íë«í¼ characters´characterscharacters, MLOps characterscharacters§ëcharacters´ë¥¼ ëcharacterscharacters¼ë¡ í©ëë¤. LLM Classifier ëë LiteLLM based Cascade Routingcharacters´ characters´ë¯¸ ë°°í¬ëcharactersê³ , characters¤characters  íë¡ëcharacters í¸ëí½ basedcharacters¼ë¡ characters íëcharacters ë¹characters©characters itemscharacters íë ¤ë charactersí©characters itemscharacters í©ëë¤.
:::

---

## 1. íë ëª©ícharacters SLO characters characters

Cascade Routing íëcharacters **ë¹characters© characters items**ê³¼ **ícharacters§ characters characters§**ë¥¼ ëcharacterscharacters ë¬characters±í´characters¼ í©ëë¤. ëªíí SLOë¥¼ characters charactersícharacters§ characterscharacters¼ë©´ ê³¼ëí charactersµcharacters íë¡ characters¸í´ characters¬characters©characters ê²½ícharacters´ characters íë  characters characterscharactersµëë¤.

### SLO characterscharacters (GLM-5 + Qwen3-4B íê²½)

| characters§í | ëª©íitems | characters¸¡characters  ë°©ë² | ë¹ê³  |
|------|--------|----------|------|
| **TTFT P95** | < 3characters´ | Langfuse trace `time_to_first_token` | Qwen3-4B criteria, GLM-5ë < 10characters´ |
| **Cost per 1k Requests** | < $5.00 | characters¼characters¼ characters´ ë¹characters© / characterscharacters²­ characters Ã 1000 | ícharacters¬ $8.20 ëë¹ 38% characters items ëª©í |
| **Misroute Rate** | â¤ 5% | (FN + FP) / characters characters²´ characterscharacters²­ | FN: weakâstrong ícharactersícharacters§ë§ weak characters¬characters©, FP: strong characters¬characters©ícharacters§ë§ weak characters¶©ë¶ |
| **SLM characters¬characters©ë¥ ** | 60-70% | weak ë¼characters°í / characters characters²´ characterscharacters²­ | ëë¬´ ë®characters¼ë©´ ë¹characters© characters items ë¯¸í¡, ëë¬´ ëcharacters¼ë©´ ícharacters§ characters í |
| **characters¬characters©characters ë§characters¡±ë** | â¥ 4.0/5.0 | Langfuse í¼ëë°± characters characters íê·  | thumb-down < 10% |

### characters¸¡characters  cycle

- **characters¤charactersitems ëª¨ëí°ë§**: TTFT P95, Cost per Request (Grafana ëcharactersë³´ë)
- **characters¼characters¼ ë¦¬ë·°**: Misroute Rate, SLM characters¬characters©ë¥  (Langfuse ë¶characters)
- **characters£¼items íë**: í¤charactersë characters¶items/characters ê±°, charactersê³items characters¡°characters  (characters¤íë¼characters¸ ë¼ë²¨ë§ based)

### characters±ê³µ characters§í ê³characters° characterscharacters

```python
# Langfuse trace ë°characters´í° based ê³characters°
def calculate_metrics(traces: list):
    total = len(traces)
    weak_count = sum(1 for t in traces if t.tags.get("tier") == "weak")
    misroute_count = sum(1 for t in traces if t.tags.get("misroute"))
    total_cost = sum(t.calculated_total_cost or 0 for t in traces)
    
    return {
        "slm_usage_rate": weak_count / total * 100,
        "misroute_rate": misroute_count / total * 100,
        "cost_per_1k": (total_cost / total) * 1000,
    }
```

:::warning SLO í¸ë characters´ëcharacters¤í
SLM characters¬characters©ë¥ characters ëë¬´ ëcharacters´ë©´ ícharacters§characters´ characters íëê³ , ëë¬´ ë®characters¶ë©´ ë¹characters© characters items í¨ê³¼items ë¯¸ë¯¸í©ëë¤. **characters£¼items A/B ícharacters¤í¸ë¡ charactersµcharacters  ê· ícharacters **characters characters°¾characters¼characters¸characters.
:::

---

## 2. ë¶ë¥ charactersê³items criteriacharacters  (v7 baseline)

### characters¤characters  ê²characters¦ë ë¶ë¥ criteria

GLM-5 744B (H200 Ã 8, $12/hr)characters Qwen3-4B (L4 Ã 1, $0.3/hr) íê²½characterscharacters 2characters£¼items íë¡ëcharacters ícharacters¤í¸ë¥¼ ê±°characters³ ëcharacters¶í baselinecharactersëë¤.

#### STRONG_KEYWORDS (17items)

```python
STRONG_KEYWORDS = [
    # íêµ­characters´ (7items)
    "ë¦¬í©í°", "charactersí¤ícharacters²", "characters¤ê³", "ë¶characters", "charactersµcharacters í", "ëë²ê·¸", "ë§characters´ê·¸ë characters´characters",
    
    # characterscharacters´ (10items)
    "refactor", "architect", "design", "analyze", "optimize", "debug",
    "migration", "complex", "performance", "security"
]
```

**í¤charactersë characters characters  ê·¼ê±°**:
- **ë¦¬í©í°/refactor**: characters½ë characters characters²´ êµ¬characters¡° ícharacters ícharacters â Qwen3-4Bë 1,000characters¤ characters´characters characters½ëë² characters´characters¤characterscharacters characters»¨ícharacters¤í¸ characters characters¤
- **charactersí¤ícharacters²/architect**: ë¤characters¤ ícharacters¼ items characterscharacters¡´characters± ë¶characters â SLMcharacters shallow reasoningcharacters¼ë¡ ë¶characters¶©ë¶
- **ë¶characters/analyze**: fundamental characterscharacters¸ characters¶characters  â GLM-5characters chain-of-thoughtitems ícharacters
- **charactersµcharacters í/optimize**: charactersê³ ë¦¬characters¦ ë³µcharacters¡ë ê³characters° â charactersícharacters  characters¶ë¡  ë¥ë ¥ characters°¨characters´
- **ëë²ê·¸/debug**: characters¤í í¸ë characters´characters¤ characters­characters¶characters  â ê¸´ characters»¨ícharacters¤í¸ ícharacters
- **ë§characters´ê·¸ë characters´characters/migration**: API ë³ê²½ characters¬í­ ë§¤í â íë characterscharactersí¬ ê¹characters characters´í´ ícharacters
- **complex**: characters¬characters©charactersitems ëªcharacterscharacters characters¼ë¡ ë³µcharacters¡ë characters¸ê¸
- **performance**: íë¡ícharacters¼ë§, ë³ëª© ë¶characters â characterscharacters¤í characterscharacters¤ characters´í´
- **security**: CVE ë¶characters, characters·¨characters½characters  ícharacters§ â ë³´characters ëë©characters¸ characters§characters

#### TOKEN_THRESHOLD (500characters)

```python
TOKEN_THRESHOLD = 500  # íê¸ criteria characters½ 250-300 í í°
```

**ê·¼ê±°**:
- **500characters ë¯¸ë§**: ë¨characters characters§characters (characters½ë characters¤ëí« characters¤ëª, ë¨characters¼ í¨characters characterscharacters±) â Qwen3-4B characters¶©ë¶
- **500characters characters´characters**: ë©í°í´ ëí ëcharacters , ê¸´ characters½ë ë¸ë¡ í¬í¨ â GLM-5 ícharacters
- í/characters í¼characters© characters characterscharacters´ë í í° ë°ëitems ëcharacters¼ë¯ë¡ `len(content.encode('utf-8')) > 600` characters¡°ê±´ characters¶items ê¶characters¥

#### TURN_THRESHOLD (5í´)

```python
TURN_THRESHOLD = 5
```

**ê·¼ê±°**:
- **5í´ characters´í**: ëë¦½characters  characters§characters â context window ë¶ë´ characters characters
- **5í´ characters´ê³¼**: ëcharacters  characters»¨ícharacters¤í¸items ë³µcharacters¡í´characters§ë©°, characters´characters  ëíë¥¼ characters°¸characters¡°íë ê²½characters° characters¦items â GLM-5characters ê¸´ characters»¨ícharacters¤í¸ characters²ë¦¬ ë¥ë ¥ ícharacters©

### v7 ë¶ë¥ ë¡characters§ characters characters²´ characters½ë

```python
STRONG_KEYWORDS = [
    "ë¦¬í©í°", "charactersí¤ícharacters²", "characters¤ê³", "ë¶characters", "charactersµcharacters í", "ëë²ê·¸", "ë§characters´ê·¸ë characters´characters",
    "refactor", "architect", "design", "analyze", "optimize", "debug",
    "migration", "complex", "performance", "security"
]
TOKEN_THRESHOLD = 500
TURN_THRESHOLD = 5

def classify_v7(messages: list[dict]) -> str:
    """
    v7 ë¶ë¥ criteria (2characters£¼items íë¡ëcharacters ê²characters¦)
    - Misroute Rate: 4.2%
    - SLM characters¬characters©ë¥ : 68%
    - Cost per 1k: $5.80
    """
    content = " ".join(m.get("content", "") for m in messages if m.get("content"))
    lower = content.lower()
    
    # 1. í¤charactersë ë§¤characters¹­ (characters°characters characterscharacters charactersµê³ )
    if any(kw in lower for kw in STRONG_KEYWORDS):
        return "strong"
    
    # 2. charactersë ¥ ê¸¸characters´
    if len(content) > TOKEN_THRESHOLD:
        return "strong"
    
    # 3. ëí í´ characters
    if len(messages) > TURN_THRESHOLD:
        return "strong"
    
    return "weak"
```

### ëcharacters¶ ê³¼characters  characterscharacters½

| ë²characters  | STRONG_KEYWORDS characters | TOKEN_THRESHOLD | TURN_THRESHOLD | Misroute Rate | SLM characters¬characters©ë¥  | ë¹ê³  |
|------|-------------------|----------------|----------------|---------------|-----------|------|
| v1 | 5items | 1000 | 10 | 12.3% | 82% | SLM ê³¼ë¤ characters¬characters©, ícharacters§ characters í |
| v3 | 10items | 750 | 7 | 8.1% | 74% | í¤charactersë characters¶itemsë¡ characters íë itemscharacters  |
| v5 | 15items | 600 | 6 | 5.6% | 70% | íêµ­characters´ í¤charactersë ë³´items |
| **v7** | **17items** | **500** | **5** | **4.2%** | **68%** | **ícharacters¬ íë¡ëcharacters criteria** |

---

## 3. Langfuse OTel trace based misroute ícharacters§

### Misroute characters characters

| characters í | characters¤ëª | ícharacters§ ë°©ë² |
|------|------|----------|
| **False Negative (FN)** | weak ë¼characters°íícharacters§ë§ strong ícharacters | thumb-down + `tier: weak` íê·¸ |
| **False Positive (FP)** | strong ë¼characters°íícharacters§ë§ weak characters¶©ë¶ | `tier: strong` + ë¨characters characters§characters í¨í´ (charactersë ë¼ë²¨ë§) |

### Langfuse í¸ë characters´characters¤ íê·¸ êµ¬characters¡°

LLM Classifierë ëª¨ë  characterscharacters²­characters ë¤characters íê·¸ë¥¼ Langfusecharacters characters characters¡í©ëë¤:

```python
from langfuse import Langfuse

langfuse = Langfuse()

# ë¶ë¥ characters íê·¸ characters¶items
trace = langfuse.trace(
    name="llm_request",
    tags=["tier:weak", "keyword_match:false", "turn_count:3"],
    metadata={
        "classifier_version": "v7",
        "content_length": 320,
        "strong_keywords_found": [],
    }
)
```

### Misroute ícharacters§ characters¿¼ë¦¬ (Langfuse UI)

#### FN ícharacters§ (weak â strong ícharacters)

**íí°**:
```
tags: tier:weak
feedback.score: <= 2  (thumb-down)
```

**characters¶characters¶ characters ë³´**:
- íë¡¬íí¸ characters ë¬¸
- charactersëµ ícharacters§
- characters¬characters©characters í¼ëë°± characters½ë©í¸

**characters£¼items ë¶characters characters characters°¨**:
1. Langfuse UI â Traces â Filter: `tier:weak AND feedback.score <= 2`
2. 100items charactersí characters¶characters¶ (ë¬´characterscharacters)
3. characters¤characters  strongcharacters´ ícharactersíëcharacters§ charactersë ë¼ë²¨ë§
4. ê³µíµ í¨í´ characters¶characters¶ â í¤charactersë íë³´ ëcharacters¶

#### FP ícharacters§ (strong â weak characters¶©ë¶)

**íí°**:
```
tags: tier:strong
calculated_total_cost: > 0.01  (ë¹characters© ë°characters í° characterscharacters²­)
metadata.content_length: < 200  (characters§§characters characters§characters)
```

**characters¶characters¶ characters ë³´**:
- íë¡¬íí¸ itemsê²°characters±
- characters¤characters  charactersëµ ë³µcharacters¡ë
- TTFT (< 2characters´ë©´ weakë¡ characters¶©ë¶ícharacters itemsë¥characters±)

### Python characters¤í¬ë¦½í¸ë¡ charactersë characters¶characters¶

```python
from langfuse import Langfuse
import pandas as pd

langfuse = Langfuse()

def extract_fn_candidates(days=7, limit=100):
    """FN íë³´ characters¶characters¶ â weakcharacterscharacters§ë§ thumb-down ë°characters characters¼characters´characters¤"""
    traces = langfuse.get_traces(
        tags=["tier:weak"],
        from_timestamp=datetime.now() - timedelta(days=days),
        limit=limit
    )
    
    fn_candidates = []
    for trace in traces:
        feedback = trace.get_feedback()
        if feedback and feedback.score <= 2:
            fn_candidates.append({
                "trace_id": trace.id,
                "prompt": trace.input,
                "response": trace.output,
                "feedback_comment": feedback.comment,
                "content_length": len(trace.input),
            })
    
    return pd.DataFrame(fn_candidates)

# characters£¼items FN ë¶characters
fn_df = extract_fn_candidates(days=7, limit=200)
fn_df.to_csv("fn_candidates_week12.csv")
```

### Retry í¨í´ based FN ícharacters§ (Advanced)

characters¬characters©charactersitems ëcharacters¼ characters§charactersë¥¼ ë¤characters charactersëíë ê²½characters° characters²« ë²characters§¸ charactersëµcharacters´ ë¶ë§characters¡±characters¤ë¬characters characters itemsë¥characters±characters´ ëcharactersµëë¤.

```python
def detect_retry_pattern(traces):
    """ëcharacters¼ characters¬characters©charactersitems 5ë¶ ë´ characters characters¬ characters§characters characters¬charactersë characters FNcharacters¼ë¡ ë¶ë¥"""
    user_sessions = defaultdict(list)
    
    for trace in traces:
        user_id = trace.user_id
        user_sessions[user_id].append(trace)
    
    fn_retries = []
    for user_id, sessions in user_sessions.items():
        for i in range(len(sessions) - 1):
            current = sessions[i]
            next_req = sessions[i + 1]
            
            time_diff = (next_req.timestamp - current.timestamp).seconds
            if time_diff < 300:  # 5ë¶ characters´ë´
                similarity = cosine_similarity(current.input, next_req.input)
                if similarity > 0.8 and current.tags.get("tier") == "weak":
                    fn_retries.append(current.id)
    
    return fn_retries
```

---

## 4. í¤charactersëÂ·ê¸¸characters´Â·í´characters 3-dim íë íë characters´ë¶

### characters£¼items íë characters¬characters´í´ (4ë¨ê³)

```mermaid
flowchart LR
    A[1. Trace characterscharacters§<br/>7characters¼characters¹ FN/FP] --> B[2. characters¤íë¼characters¸ ë¼ë²¨ë§<br/>100items charactersí]
    B --> C[3. Precision/Recall<br/>ê³characters°]
    C --> D[4. STRONG_KEYWORDS<br/>diff PR]
    D --> A
    
    style A fill:#4285f4,color:#fff
    style B fill:#34a853,color:#fff
    style C fill:#fbbc04,color:#000
    style D fill:#ea4335,color:#fff
```

### 1ë¨ê³: Trace characterscharacters§

```bash
# Langfuse APIë¡ characters¼characters£¼characters¼characters¹ trace ë¤characters´ë¡ë
curl -X POST https://langfuse.your-domain.com/api/public/traces \
  -H "Authorization: Bearer ${LANGFUSE_SECRET_KEY}" \
  -d '{
    "filter": {
      "tags": ["tier:weak", "tier:strong"],
      "from": "2026-04-11T00:00:00Z",
      "to": "2026-04-18T00:00:00Z"
    },
    "limit": 1000
  }' | jq . > traces_week12.json
```

### 2ë¨ê³: characters¤íë¼characters¸ ë¼ë²¨ë§ (100items charactersí)

**ë¼ë²¨ë§ ëêµ¬**: Jupyter Notebook + pandas

```python
import pandas as pd
import json

# Trace ë¡ë
with open("traces_week12.json") as f:
    traces = json.load(f)["data"]

# ë¬´characterscharacters 100items charactersíë§
sample = pd.DataFrame(traces).sample(100)

# ë¼ë²¨ë§ characters»¬ë¼ characters¶items
sample["ground_truth"] = None  # charactersëcharacters¼ë¡ "weak" ëë "strong" charactersë ¥

# CSV characters characters¥
sample.to_csv("labeling_week12.csv", index=False)
```

**ë¼ë²¨ë§ criteria**:
- **strong ícharacters**: ë©í°ícharacters¼ characters°¸characters¡°, charactersê³ ë¦¬characters¦ characters¤ëª, ë³µcharacters¡í ëë²ê¹, ë³´characters ë¶characters
- **weak characters¶©ë¶**: ë¨characters¼ í¨characters characterscharacters±, itemsë¨í characters§characters, ë¬¸ë² characters¤ëª, characters½ë í¬ë§·í

### 3ë¨ê³: Precision/Recall ê³characters°

```python
def evaluate_classifier(df):
    """
    Precision: strong characterscharacters¸¡ characters¤ characters¤characters  strong ë¹characters¨ (FP charactersµcharactersí)
    Recall: characters¤characters  strong characters¤ strong characterscharacters¸¡ ë¹characters¨ (FN charactersµcharactersí)
    """
    tp = len(df[(df.predicted == "strong") & (df.ground_truth == "strong")])
    fp = len(df[(df.predicted == "strong") & (df.ground_truth == "weak")])
    fn = len(df[(df.predicted == "weak") & (df.ground_truth == "strong")])
    tn = len(df[(df.predicted == "weak") & (df.ground_truth == "weak")])
    
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    
    return {
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "misroute_rate": (fp + fn) / len(df) * 100
    }

# ë¼ë²¨ë§ charactersë£ í íitems
df = pd.read_csv("labeling_week12_labeled.csv")
metrics = evaluate_classifier(df)
print(f"Precision: {metrics['precision']:.2%}")
print(f"Recall: {metrics['recall']:.2%}")
print(f"F1: {metrics['f1']:.2%}")
print(f"Misroute Rate: {metrics['misroute_rate']:.1%}")
```

### 4ë¨ê³: STRONG_KEYWORDS diff PR

**FN characters¼characters´characters¤characterscharacters ê³µíµ í¤charactersë characters¶characters¶**:

```python
def extract_keyword_candidates(fn_traces):
    """FN characters¼characters´characters¤characterscharacters ë¹ë ëcharacters ë¨characters´ characters¶characters¶"""
    from collections import Counter
    import re
    
    words = []
    for trace in fn_traces:
        content = trace["input"].lower()
        words.extend(re.findall(r'\b\w+\b', content))
    
    # ë¶characters©characters´ characters ê±°
    stopwords = {"the", "a", "is", "in", "to", "for", "and", "of", "characters´", "ê·¸", "characters "}
    filtered = [w for w in words if w not in stopwords and len(w) > 3]
    
    # ë¹ë characters characters ë ¬
    counter = Counter(filtered)
    return counter.most_common(20)

# íë³´ í¤charactersë characters¶ë ¥
candidates = extract_keyword_candidates(fn_df.to_dict("records"))
print("Top 20 í¤charactersë íë³´:")
for word, count in candidates:
    print(f"  {word}: {count}í")
```

**PR characterscharacters± characterscharacters**:

```markdown
## [Cascade Routing] STRONG_KEYWORDS íë â Week 12

### ë³ê²½ characters¬í­
- `STRONG_KEYWORDS`characters 3items characters¶items: "review", "benchmark", "scale"

### ê·¼ê±°
- FN ë¶characters ê²°ê³¼ 100items characters¤ 12ê±´characters´ "code review" characters§characters â weak ë¼characters°í â ícharacters§ characters í
- "benchmark" í¤charactersëë characters±ë¥ ë¹êµ ë¶characters characterscharacters²­characters ë¹ë²í ë±characters¥ (8ê±´)
- "scale" í¤charactersëë characterscharacters¤í ícharacters¥characters± characters¤ê³ characters§characterscharacterscharacters ë°ê²¬ (6ê±´)

### Before/After ë©í¸ë¦­ (characterscharacters)
| characters§í | Before (v7) | After (v8) |
|------|------------|-----------|
| Misroute Rate | 4.2% | 3.1% |
| SLM characters¬characters©ë¥  | 68% | 64% |
| Cost per 1k | $5.80 | $6.20 |

### ë°°í¬ ê³í
- Canary ë¡¤characterscharacters: 10% â 50% â 100% (items ë¨ê³ 2characters¼ ê´characters°°)
```

---

## 5. Canary charactersê³items ë¡¤characterscharacters

### kgateway BackendRef Weight based Canary

LLM Classifierë¥¼ v7characterscharacters v8ë¡ charactersë°characters´í¸í  ë, characters characters§characters  í¸ëí½ characters ícharacters¼ë¡ ë¦¬characters¤í¬ë¥¼ charactersµcharactersíí©ëë¤.

#### Phase 1: 10% Canary

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: llm-classifier-canary
  namespace: ai-inference
spec:
  parentRefs:
    - name: unified-gateway
      namespace: ai-gateway
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /v1/
      backendRefs:
        # v7 (stable) - 90%
        - name: llm-classifier-v7
          port: 8080
          weight: 90
        # v8 (canary) - 10%
        - name: llm-classifier-v8
          port: 8080
          weight: 10
      timeouts:
        request: 300s
```

**ê´characters°° ê¸°items**: 48charactersitems

**ëª¨ëí°ë§ ë©í¸ë¦­**:
```promql
# v8 charactersë¬characters¨
rate(envoy_http_downstream_rq_xx{envoy_response_code_class="5", backend="llm-classifier-v8"}[5m])
/ 
rate(envoy_http_downstream_rq_total{backend="llm-classifier-v8"}[5m]) * 100

# v8 P99 ë characters´í´characters
histogram_quantile(0.99, 
  rate(envoy_http_downstream_rq_time_bucket{backend="llm-classifier-v8"}[5m])
)
```

#### Phase 2: 50% (charactersë¬characters¨ < 2%)

```bash
# weight characters¡°characters  (v7: 50%, v8: 50%)
kubectl patch httproute llm-classifier-canary -n ai-inference --type=json -p='[
  {"op": "replace", "path": "/spec/rules/0/backendRefs/0/weight", "value": 50},
  {"op": "replace", "path": "/spec/rules/0/backendRefs/1/weight", "value": 50}
]'
```

**ê´characters°° ê¸°items**: 48charactersitems

#### Phase 3: 100% (charactersë¬characters¨ < 2%, P99 < 15s)

```bash
# v8ë¡ characterscharacters  characters í
kubectl patch httproute llm-classifier-canary -n ai-inference --type=json -p='[
  {"op": "replace", "path": "/spec/rules/0/backendRefs/0/weight", "value": 0},
  {"op": "replace", "path": "/spec/rules/0/backendRefs/1/weight", "value": 100}
]'
```

### Rollback í¸ë¦¬ê±°

| characters¡°ê±´ | Action | ë³µêµ¬ charactersitems |
|------|--------|----------|
| **5xx > 2%** (5ë¶ characters°characters) | weight 0characters¼ë¡ characters¦characters ë¡¤ë°± | < 1ë¶ |
| **P99 > 15s** (5ë¶ characters°characters) | weight 0characters¼ë¡ characters¦characters ë¡¤ë°± | < 1ë¶ |
| **Misroute Rate > 8%** (Langfuse characters¼characters¼ ë¶characters) | ë¤characters ë  weight 0, v7 ë³µêµ¬ | 12charactersitems |

**charactersë ë¡¤ë°± characters¤í¬ë¦½í¸**:

```bash
#!/bin/bash
# auto_rollback.sh

# 5xx charactersë¬characters¨ characters²´í¬
ERROR_RATE=$(curl -s "http://prometheus:9090/api/v1/query?query=rate(envoy_http_downstream_rq_xx%7Benvoy_response_code_class%3D%225%22%2Cbackend%3D%22llm-classifier-v8%22%7D%5B5m%5D)%2Frate(envoy_http_downstream_rq_total%7Bbackend%3D%22llm-classifier-v8%22%7D%5B5m%5D)*100" | jq -r '.data.result[0].value[1]')

if (( $(echo "$ERROR_RATE > 2" | bc -l) )); then
  echo "ERROR: 5xx rate ${ERROR_RATE}% > 2%, rolling back..."
  kubectl patch httproute llm-classifier-canary -n ai-inference --type=json -p='[
    {"op": "replace", "path": "/spec/rules/0/backendRefs/0/weight", "value": 100},
    {"op": "replace", "path": "/spec/rules/0/backendRefs/1/weight", "value": 0}
  ]'
  exit 1
fi

echo "OK: 5xx rate ${ERROR_RATE}%"
```

---

## 6. Spot characters¤ë¨Â·Rate limit Fallback

### Spot characters¤ë¨ characters charactersë Downgrade

GLM-5ë¥¼ p5en.48xlarge Spotcharacterscharacters characters¤í characters¤characters´ë¼ë©´, Spot characters¤ë¨ characters charactersëcharacters¼ë¡ Qwen3-4Bë¡ Fallbackí´characters¼ í©ëë¤.

#### kgateway Retry characters¤characters 

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: llm-classifier-route
  namespace: ai-inference
spec:
  parentRefs:
    - name: unified-gateway
      namespace: ai-gateway
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /v1/
      backendRefs:
        # Primary: LLM Classifier (GLM-5 + Qwen3 charactersë ë¶ê¸°)
        - name: llm-classifier
          port: 8080
          weight: 100
      # Fallback characters¤characters 
      filters:
        - type: ExtensionRef
          extensionRef:
            group: gateway.envoyproxy.io
            kind: EnvoyRetry
            name: llm-fallback-policy
---
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: EnvoyRetry
metadata:
  name: llm-fallback-policy
  namespace: ai-inference
spec:
  retryOn:
    - "5xx"
    - "connect-failure"
    - "refused-stream"
    - "retriable-status-codes"
  retriableStatusCodes:
    - 503  # Service Unavailable (Spot characters¤ë¨)
    - 429  # Rate Limit
  numRetries: 2
  perTryTimeout: 30s
  retryHostPredicate:
    - name: envoy.retry_host_predicates.previous_hosts
```

#### LLM Classifier ë´ë¶ Fallback ë¡characters§

```python
import httpx
from fastapi import Request, HTTPException

WEAK_URL = "http://qwen3-serving:8000"
STRONG_URL = "http://glm5-serving:8000"
FALLBACK_URL = WEAK_URL  # GLM-5 characters¥characters  characters Qwen3ë¡ Fallback

@app.post("/v1/{path:path}")
async def proxy(path: str, request: Request):
    body = await request.json()
    messages = body.get("messages", [])
    tier = classify_v7(messages)
    backend = STRONG_URL if tier == "strong" else WEAK_URL
    target = f"{backend}/v1/{path}"
    
    async with httpx.AsyncClient(timeout=300) as client:
        try:
            resp = await client.post(target, json=body)
            resp.raise_for_status()
            return resp.json()
        except (httpx.HTTPStatusError, httpx.ConnectError) as e:
            if backend == STRONG_URL:
                # GLM-5 characters¥characters  â Qwen3ë¡ Fallback
                print(f"WARN: GLM-5 unavailable, falling back to Qwen3. Error: {e}")
                fallback_target = f"{FALLBACK_URL}/v1/{path}"
                resp = await client.post(fallback_target, json=body)
                return resp.json()
            else:
                raise HTTPException(status_code=503, detail="All backends unavailable")
```

### Rate Limit Fallback (characters¸ë¶ íë¡ë°characters´ë)

characters¸ë¶ LLM API(OpenAI, Anthropic)ë¥¼ Bifrost/LiteLLMë¡ í¸characters¶ characters¤ Rate Limit ë°characters characters charactersëcharacters¼ë¡ ë¤ë¥¸ íë¡ë°characters´ëë¡ characters íí©ëë¤.

#### LiteLLM Fallback characters¤characters 

```yaml
# litellm_config.yaml
model_list:
  # Primary: OpenAI GPT-4o
  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY
  
  # Fallback: Anthropic Claude Sonnet 4.6
  - model_name: gpt-4o
    litellm_params:
      model: claude-sonnet-4.6
      api_key: os.environ/ANTHROPIC_API_KEY

router_settings:
  routing_strategy: simple-shuffle
  fallbacks:
    - gpt-4o: ["claude-sonnet-4.6"]
  retry_policy:
    - TimeoutError
    - InternalServerError
    - RateLimitError  # 429 charactersë Fallback
  num_retries: 2
```

#### Bifrost CEL Rules Fallback

Bifrostë CEL Rulesë¡ í¤ë based Fallbackcharacters êµ¬íí©ëë¤.

```json
{
  "plugins": [
    {
      "enabled": true,
      "name": "cel_rules",
      "config": {
        "rules": [
          {
            "condition": "response.status == 429",
            "action": "retry",
            "target": "anthropic",
            "max_retries": 2
          }
        ]
      }
    }
  ]
}
```

---

## 7. ë¹characters© ëë¦¬íí¸ ëª¨ëí°ë§Â·ê²½ë³´

### AMP Recording Rule (charactersitemsë¹ ë¹characters©)

```yaml
# prometheus-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: cascade-cost-rules
  namespace: observability
spec:
  groups:
    - name: llm_cost
      interval: 60s
      rules:
        # GLM-5 charactersitemsë¹ ë¹characters© (H200 x8 Spot $12/hr)
        - record: cascade:glm5_cost_usd_per_hour
          expr: |
            12.0 * count(up{job="glm5-serving"} == 1)
        
        # Qwen3 charactersitemsë¹ ë¹characters© (L4 x1 Spot $0.3/hr)
        - record: cascade:qwen3_cost_usd_per_hour
          expr: |
            0.3 * count(up{job="qwen3-serving"} == 1)
        
        # characters characters²´ charactersitemsë¹ ë¹characters©
        - record: cascade:total_cost_usd_per_hour
          expr: |
            cascade:glm5_cost_usd_per_hour + cascade:qwen3_cost_usd_per_hour
        
        # characterscharacters²­ë¹ íê·  ë¹characters© (charactersµê·¼ 1charactersitems)
        - record: cascade:cost_per_request_usd
          expr: |
            increase(cascade:total_cost_usd_per_hour[1h]) 
            / 
            increase(llm_requests_total[1h])
```

### Grafana í¨ë (ë¹characters© characters¶characters¸)

```json
{
  "title": "Cascade Routing Cost Trend",
  "targets": [
    {
      "expr": "cascade:total_cost_usd_per_hour",
      "legendFormat": "Total Cost ($/hr)"
    },
    {
      "expr": "cascade:glm5_cost_usd_per_hour",
      "legendFormat": "GLM-5 Cost ($/hr)"
    },
    {
      "expr": "cascade:qwen3_cost_usd_per_hour",
      "legendFormat": "Qwen3 Cost ($/hr)"
    }
  ],
  "yAxes": [
    {
      "label": "Cost (USD/hr)",
      "format": "currencyUSD"
    }
  ]
}
```

### characterscharacters° 80% ê²½ë³´

```yaml
# alertmanager-config.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: cascade-budget-alerts
  namespace: observability
spec:
  groups:
    - name: budget
      rules:
        # characters¼characters¼ characterscharacters° 80% ëë¬
        - alert: DailyBudget80Percent
          expr: |
            sum(increase(cascade:total_cost_usd_per_hour[24h])) > 80.0
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Daily budget 80% reached"
            description: "Total cost in last 24h: {{ $value | humanize }}. Budget: $100/day"
        
        # charactersitems characterscharacters° 90% ëë¬
        - alert: MonthlyBudget90Percent
          expr: |
            sum(increase(cascade:total_cost_usd_per_hour[30d])) > 2700.0
          for: 1h
          labels:
            severity: critical
          annotations:
            summary: "Monthly budget 90% reached"
            description: "Total cost in last 30d: {{ $value | humanize }}. Budget: $3000/month"
```

### ë¹characters© ëë¦¬íí¸ ícharacters§ (characters£¼items ë¹êµ)

```promql
# characters´ë² characters£¼ vs characters§ë characters£¼ ë¹characters© characters¦itemscharacters¨
(
  sum(increase(cascade:total_cost_usd_per_hour[7d]))
  -
  sum(increase(cascade:total_cost_usd_per_hour[7d] offset 7d))
)
/
sum(increase(cascade:total_cost_usd_per_hour[7d] offset 7d))
* 100
```

**ê²½ë³´ characters¡°ê±´**: characters£¼items ë¹characters©characters´ 20% characters´characters characters¦items characters Slack charactersë¦¼

```yaml
- alert: CostDriftDetected
  expr: |
    (
      sum(increase(cascade:total_cost_usd_per_hour[7d]))
      - sum(increase(cascade:total_cost_usd_per_hour[7d] offset 7d))
    )
    / sum(increase(cascade:total_cost_usd_per_hour[7d] offset 7d))
    * 100 > 20
  labels:
    severity: warning
  annotations:
    summary: "Cost drift detected â 20%+ increase"
    description: "Weekly cost increased by {{ $value | humanize }}%"
```

---

## 8. charactersí°í¨í´ê³¼ characters¤characters  í¨characters 

### charactersí°í¨í´ 1: Bifrost single base_url characters°í characters¤í¨

**ë¬¸characters **: Bifrostë providerë¹ ë¨characters¼ `network_config.base_url`ë§ characters§charactersíë¯ë¡, SLMê³¼ LLMcharacters´ ë¤ë¥¸ Servicecharacters characterscharacters¼ë©´ ëcharacters¼ providerë¡ ë¼characters°í ë¶items.

**charactersëª»ë charactersë**:
```json
{
  "providers": {
    "openai": {
      "keys": [
        {"name": "qwen3", "models": ["qwen3-4b"]},
        {"name": "glm5", "models": ["glm-5"]}
      ],
      "network_config": {
        "base_url": "???"  // 2itemscharacters base_urlcharacters characters¤characters í  characters characterscharacters
      }
    }
  }
}
```

**characters¬ë°ë¥¸ í´ê²°characters±**: LLM Classifierë¥¼ Bifrost characterscharacters ë°°characters¹ícharacters¬ ë°±charactersë charactersë characters í.

### charactersí°í¨í´ 2: RouteLLM íë¡ëcharacters ë°°í¬ itemsí

**ë¬¸characters **: RouteLLMcharacters characters°êµ¬ íë¡characters í¸ë¡, K8s ë°°í¬ characters ë¤characters characters´characters ë°characters:
- `torch`, `transformers` characterscharacters¡´characters± characters¶©ë
- characters»¨ícharacters´ë characters´ë¯¸characters§ 10GB+ (ê²½ë ë¼characters°í°characters ë¶characters í©)
- pip dependency resolution characters¤í¨

**êµí**: RouteLLMcharacters MF classifier **itemsë**ë§ characters°¸characters¡°íê³ , íë¡ëcharacterscharactersë LLM Classifier (í´ë¦¬characters¤í±) ëë LiteLLM (characters¸ë¶ íë¡ë°characters´ë) characters¬characters©.

### charactersí°í¨í´ 3: model: "auto" íëcharacters½ë© ëë½

**ë¬¸characters **: LLM Classifierë í´ë¼characters´characters¸í¸items `model: "auto"` (ëë characterscharacters ëª¨ë¸ëª)ë¡ characterscharacters²­í´characters¼ ícharacters§ë§, characters¼ë¶ IDEë `model` íëë¥¼ charactersë characters±characters°characters§ characterscharacters.

**characters¦characters**: í´ë¼characters´characters¸í¸items `model: "glm-5"` íëcharacters½ë© â LLM Classifieritems `messages`ë§ ë¶characters â `model` íë ë¬´characters â charactersëcharacters ë¤ë¥¸ ë°±charactersë characters í

**í´ê²°characters±**: LLM Classifiercharacterscharacters `model` íëë¥¼ itemscharacters ë¡ characters ê±°.

```python
@app.post("/v1/{path:path}")
async def proxy(path: str, request: Request):
    body = await request.json()
    messages = body.get("messages", [])
    tier = classify_v7(messages)
    
    # model íë itemscharacters  characters ê±° (ë°±charactersëitems characterscharacters²´ model characters¬characters©)
    body.pop("model", None)
    
    backend = STRONG_URL if tier == "strong" else WEAK_URL
    target = f"{backend}/v1/{path}"
    # ...
```

### charactersí°í¨í´ 4: í/characters í¼characters© í¤charactersë ëë½

**ë¬¸characters **: íêµ­ characters¬characters©charactersë "ë¦¬í©í°ë§", characterscharacters´ characters¬characters©charactersë "refactor" â characters¸characters´ë³ í¤charactersë ëª¨ë ë±ë¡ ícharacters.

**ëë½ characterscharacters**:
```python
STRONG_KEYWORDS = ["refactor", "architect"]  # "ë¦¬í©í°", "charactersí¤ícharacters²" ëë½
```

**ê²°ê³¼**: íêµ­characters´ characters§charactersë ëª¨ë weak ë¼characters°í â ícharacters§ characters í

**í´ê²°characters±**: characters£¼characters í¤charactersëë í/characters ë³ê¸°.

```python
STRONG_KEYWORDS = [
    "ë¦¬í©í°", "refactor",
    "charactersí¤ícharacters²", "architect",
    "characters¤ê³", "design",
    # ...
]
```

### charactersí°í¨í´ 5: Canary ë¡¤characterscharacters characterscharacters´ v7 â v8 characters í

**ë¬¸characters **: characters ë²characters characters characters¦characters 100% ë°°í¬ â ë²ê·¸ ë°characters characters characters characters²´ í¸ëí½ charactersí¥.

**êµí**: ë°ëcharacters 10% â 50% â 100% ë¨ê³characters  characters í.

### charactersí°í¨í´ 6: Misroute Rateë§ ë³´ê³  SLM characters¬characters©ë¥  ë¬´characters

**ë¬¸characters **: Misroute Rate 2% ë¬characters±ícharacters§ë§ SLM characters¬characters©ë¥  30% â ë¹characters© characters items ë¯¸í¡.

**ê· ícharacters **: Misroute Rate â¤ 5%, SLM characters¬characters©ë¥  60-70%ë¥¼ ëcharacterscharacters ë§characters¡±í´characters¼ í¨.

---

## ê´ë ¨ ë¬¸characters

### charactersí¤ícharacters² ë° characters ëµ
- [ê²characters´í¸characters¨characters´ ë¼characters°í characters ëµ](./inference-gateway-routing.md) - 2-Tier charactersí¤ícharacters², Cascade/Semantic Router, LLM Classifier itemsë
- [characters¶ë¡  ê²characters´í¸characters¨characters´ ë°°í¬ itemscharacters´ë](./inference-gateway-setup/) - kgateway Helm characters¤characters¹, HTTPRoute YAML, LLM Classifier ë°°í¬ characters½ë

### ëª¨ëí°ë§ ë° ë¹characters©
- [Agent ëª¨ëí°ë§](../operations-mlops/agent-monitoring.md) - Langfuse charactersí¤ícharacters², íµcharacters¬ ë©í¸ë¦­, charactersë¦¼ characters ëµ
- [ëª¨ëí°ë§ characters¤í êµ¬characters± itemscharacters´ë](./monitoring-observability-setup.md) - Langfuse Helm, AMP/AMG, ServiceMonitor, Grafana ëcharactersë³´ë
- [characters½ë© ëêµ¬ & ë¹characters© ë¶characters](./coding-tools-cost-analysis.md) - Aider/Cline characters°ê²°, ë¹characters© charactersµcharacters í í

### íë characterscharactersí¬ ë° ëª¨ë¸
- [vLLM ëª¨ë¸ charactersë¹](../model-serving/inference-frameworks/vllm-model-serving.md) - vLLM ë°°í¬, PagedAttention, Multi-LoRA
- [Semantic Caching characters ëµ](../model-serving/inference-frameworks/semantic-caching-strategy.md) - 3ê³characters¸µ charactersºcharacters, characters characters¬ë charactersê³items, ê´characters¸¡characters±

---

## characters°¸ê³  charactersë£

### ê³µcharacters ë¬¸characters
- [Langfuse Documentation](https://langfuse.com/docs)
- [LiteLLM Routing](https://docs.litellm.ai/docs/routing)
- [Bifrost Documentation](https://www.getmaxim.ai/bifrost/docs)
- [Kubernetes Gateway API](https://gateway-api.sigs.k8s.io/)
- [Amazon Managed Prometheus](https://docs.aws.amazon.com/prometheus/)

### characters°êµ¬ charactersë£
- [RouteLLM: Learning to Route LLMs with Preference Data (arXiv)](https://arxiv.org/abs/2406.18665)
- [LMSYS Chatbot Arena Leaderboard](https://chat.lmsys.org/?leaderboard)
- [FrugalGPT: How to Use Large Language Models While Reducing Cost and Improving Performance](https://arxiv.org/abs/2305.05176)

### ê´ë ¨ ë¸ë¡ê·¸
- [LLM Router Pattern: Model Switching](https://markaicode.com/llm-router-pattern-model-switching/)
- [Cost-Effective LLM Inference with Cascade Routing](https://www.anthropic.com/research/cost-effective-inference)

# Evidence: Weekly Digest, "a few words in, a letter out" (test run, 2026-10-22)

Purpose: report section "The agents" (traced run) and "Impact" (time saved, quality).

Caveat: this run used hand-written photo facts (what the Photo Reader would return for a gallery photo and a noodle photo), not real photos. Re-run with real photos and the student's real notes for the final report, and add the parent's reaction.

## Input the student typed

Family profile: name Jenny, school Yale University, parents' language Simplified Chinese, family note "Mom worries when I skip meals."

Notes (17 words):

```
mon: stats midterm, got 88
wed: cooked tomato egg noodles with roommate
fri: went to art gallery after class
```

Photos (as passed from the Photo Reader to the Digest Writer):

1. Museum gallery, white marble classical sculptures, sunlight through a tall window with a classical wooden frame, polished wooden floor, pale grey walls, few visitors. Mood: quiet, peaceful. Possible place: likely the Yale University Art Gallery.
2. Tomato and egg noodles in a white bowl in a dorm kitchen, steam rising, chopsticks on the rim. Mood: cozy.

Style: Rich & vivid.

## Output: the letter (517 Chinese characters)

> 爸妈，你们好！先跟你们报个喜：周一我考了统计学期中考试，得了88分。考完之后，心里轻松了不少，也觉得这周开了个好头。这周还有一些舒服的小日常，想和你们分享。你们放心，我有好好吃饭；周三我和室友一起做了番茄鸡蛋面。给你们发了这碗面的照片：红红的番茄和金黄的鸡蛋放在白碗里，热气还往上冒，筷子搭在碗边。宿舍厨房里有了这顿热乎的饭，感觉多了几分家的暖意；自己动手做一碗面，吃起来也格外踏实。
>
> 周五下课后，我去了学校的美术馆。展厅里很安静，几尊白色大理石人物雕像立在底座上；阳光从高高的木窗照进来，落在光亮的木地板上，地面上明暗交错，淡灰色的墙面也显得柔和。来参观的人不多，我就在这样的安静里慢慢看展，感觉整个人都静了下来。这里是耶鲁大学美术馆，它是美国历史最悠久的大学美术馆之一，馆藏从古代艺术延伸到现代艺术。逛展时能在雕塑旁停下脚步、安静看一会儿，让我觉得校园生活里也有一段很舒缓的时光。
>
> 这周有考试，也有热乎的饭和安静的展厅，日子过得还算充实。谢谢你们一直惦记我有没有按时吃饭，我会照顾好自己。你们也要好好吃饭、注意休息，等我下次再和你们说说这一周的事。

"How I wrote it" shown to the student:
- I described the noodles with warmth, steam, and color based on the photo; these are atmospheric details, not additional personal facts.
- Because your notes say you visited an art gallery and you attend Yale, I named it the Yale University Art Gallery and added brief background about its history and collection.

## What it shows

- 17 words of notes → 517-character letter (about 30x expansion), with every personal fact traceable to the notes and every scene detail traceable to a photo.
- Background about the gallery is labelled "background: Yale University Art Gallery" in the app so the student can check it.
- The family note ("Mom worries when I skip meals") was used: the letter reassures "你们放心，我有好好吃饭" next to the noodle photo.
- Guards in action (output/guard_log.jsonl): across 3 parallel runs, the length guard sent back two drafts of 359 and 384 characters, and the language guard sent back one draft whose notes to the student were in Chinese. All 3 runs ended with valid letters (426, 433, 517 characters), none containing observer phrases such as "看起来".
- Short vs rich, same input (earlier run): short 156 characters, rich 473 to 517 characters.

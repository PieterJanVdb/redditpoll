# snoopoll
Convert Reddit poll threads (eg. [Indieheads Top Ten Animal Collective Songs](https://www.reddit.com/r/indieheads/comments/51ew8y/top_ten_tuesday_animal_collective/)) to a list of scores for every item, weighted by their position (eg. nr 1 gets 10 points, nr 2 gets 9 points, etc...) in a CSV format, and provides you with a list of comments that couldn't be processed. Corrects spelling mistakes up to 1 character (eg. Banshee Beat / Banshe Beat).

The comments have to be formatted in a numbered list to be properly processed, eg.:

1. Fireworks
2. Street Flash
3. The Purple Bottle
4. Alvin Row
5. Brother Sport
6. Winters Love
7. In The Flowers
8. La Rapet
9. Peacebone
10. FloriDada

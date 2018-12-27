import os
import petl
import re
import json



data_2018 = petl.util.base.empty()
for filename in os.listdir('./data/2018/'):
  data_2018 = data_2018.cat(petl.fromjson('./data/2018/'+filename))

data_2017 = petl.util.base.empty()
for filename in os.listdir('./data/2017/'):
  data_2017 = data_2017.cat(petl.fromjson('./data/2017/'+filename))

data_2018 = data_2018.distinct('updated_at')
print(data_2018.nrows())

data_2017 = data_2017.distinct('updated_at')
print(data_2017.nrows())

# Fix observed song name changes
name_changes = {
  'Have a Holly Jolly Christmas': 'A Holly Jolly Christmas',
  'Merry Christmas Darling (Remix)': 'Merry Christmas Darling',
  'The Chipmunk Song (feat. Alvin) [Christmas Don\'t Be Late]': 'The Chipmunk Song',
  'Walkin In A Winter Wonderland': 'Winter Wonderland',
  'Santa Claus Is Coming to Town (Intro)': 'Santa Claus Is Coming to Town',
  'Santa Claus Is Comin\' to Town': 'Santa Claus Is Coming to Town',
  'Have Yourself Merry Little Christmas': 'Have Yourself A Merry Little Christmas'
}
data_2017 = data_2017.convert('song_title', name_changes)
data_2018 = data_2018.convert('song_title', name_changes)

artist_changes = {
  'Michael Buble': 'Michael Bublé',
  'Michael Buble Ft Puppini Sisters': 'Michael Bublé',
  'Michael Buble Ft Shania Twain': 'Michael Bublé'
}
data_2017 = data_2017.convert('artist', artist_changes)
data_2018 = data_2018.convert('artist', artist_changes)


# Create normalized song identity columns

# Aggregations needed
song_2018 = (data_2018
  .convert('song_title', lambda t: re.sub(r'[\(\[][Ff]eat.*$', '', t))
  .addfield('artist_id', lambda rec: re.sub(r'\W', '', rec.artist).lower())
  .aggregate(('artist_id', 'song_title'), {
    'song_count_2018': len,
    'artist_2018': lambda r: r[0].artist,
  })
  .aggregate('artist_id', {
    'count_2018': ('song_count_2018', sum),
    'artist_2018': lambda r: r[0].artist_2018,
    'songs_2018': (('song_title', 'song_count_2018',), list)
  })
  .sort('count_2018', reverse=True)
  .addrownumbers(start=1, field='rank_2018')
)

song_2017 = (data_2017
  .convert('song_title', lambda t: re.sub(r'[\(\[][Ff]eat.*$', '', t))
  .addfield('artist_id', lambda rec: re.sub(r'\W', '', rec.artist).lower())
  .aggregate(('artist_id', 'song_title'), {
    'song_count_2017': len,
    'artist_2017': lambda r: r[0].artist,
  })
  .aggregate('artist_id', {
    'count_2017': ('song_count_2017', sum),
    'artist_2017': lambda r: r[0].artist_2017,
    'songs_2017': (('song_title', 'song_count_2017',), list)
  })
  .sort('count_2017', reverse=True)
  .addrownumbers(start=1, field='rank_2017')
)

totals = (
  petl.outerjoin(song_2018, song_2017, 'artist_id')
  .select(lambda rec: (rec['count_2018'] or 0) >= 1 or (rec['count_2017'] or 0) > 2)
  .addfield('artist', lambda rec: rec.artist_2018 or rec.artist_2017)
  .cutout('artist_2018', 'artist_2017', 'artist_id')
)

def rank_change(rec):
  if rec['rank_2017'] is None:
    return 1000
  elif rec['rank_2018'] is None:
    return -1000
  else:
    return rec['rank_2017'] - rec['rank_2018']

winners_losers = totals.addfield('rank_change', rank_change)
winners_losers = winners_losers.sort('rank_change', reverse=True)

for entry in winners_losers.dicts():
  print(json.dumps(entry) + ',')

# top2018 = totals.sort('count_2018', reverse=True)
# for entry in totals.dicts().islice(0,20):
#   print(str(entry) + ',')
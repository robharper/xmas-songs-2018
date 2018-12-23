
(function() {

var data2018 = data.filter(function(d) {
  return d.rank_change > -1000;
}).sort(function(a, b) {
  return a.rank_2018 - b.rank_2018
});

var newThisYear = data.filter(function(d) {
  return d.rank_change === 1000;
});
var droppedThisYear = data.filter(function(d) {
  return d.rank_change === -1000;
});

var maxArtist = Math.max.apply(null, data2018.flatMap(function(s) { return s.artists_2018.map(function(a) { return a[1]}) }));
console.log(maxArtist);

var rankQuant = d3.scaleQuantize()
  .domain([0, 20])
  .range([1, 2, 3, 4, 5]);

var color = d3.scaleLinear()
  .domain([-20, 0, 20])
  .clamp(true)
  .range(['red', '#eee', 'green']);

var subBarScale = d3.scaleLinear()
  .domain([0, maxArtist])
  .range([0, 100])

var subBarColor = d3.scaleLinear()
.domain([0, maxArtist])
.range(['rgb(140, 130, 130)', 'rgb(184, 65, 51)'])


//
// Table
//
var tbody = d3.select('#changes-table')
  .selectAll('table')
  .data(data2018)
  .enter().append('tbody');
  
var trSong = tbody.append('tr')
  .attr('class', 'song-row')
  .on('mouseover', handleMouseOver)
  .on('mouseout', handleMouseOut);

trSong.append('td').attr('class', 'rank')
  .text(function(d, i) { return i + 1; });

trSong.append('td')
  .attr('class', 'song-name')
  .attr('colspan', '2')
  .text(function(d) { return d.song_title; })

trSong.append('td').attr('class', 'play-count')
  .text(function(d) { return d.count_2018; });

var rankTd = trSong.append('td')
  .attr('class', function(d) {
    return 'song-rank-change' + ' ' + 
      ('song-rank-change-'+rankQuant(Math.abs(d.rank_change))) + ' ' + 
      (d.rank_change > 0 ? 'song-rank-change-up' : d.rank_change < 0 ? 'song-rank-change-down' : '')
  })

rankTd.append('span')
  .style('color', function(d) { return color(d.rank_change); })
  .append('svg')
    .attr('class', 'icon')
    .append('use').attr('xlink:href', function(d) {
      if (d.rank_change > 0) {
        return '#icon-arrow-up';
      } else if (d.rank_change < 0) {
        return '#icon-arrow-down';
      }
    })

rankTd.append('span')
  .attr('class', function(d) {
    return 'song-rank-change-value ' + (Math.abs(d.rank_change) >= 1000 ? 'song-rank-change-new' : '');
  })
  .text(function(d) { 
    if (Math.abs(d.rank_change) < 1000) {
      return (d.rank_change > 0 ? '+' : '') + d.rank_change 
    } else {
      return 'New'
    }
  })

//
// Details
//
var subRow = tbody.selectAll('tr.song-details')
  .data(function(d) { 
    d.artists_2018.sort(function(a1, a2) { return a2[1] - a1[1]; });
    return d.artists_2018; 
  })
    .enter()
    .append('tr').attr('class', 'song-details')

subRow.append('td')

subRow.append('td')
    .attr('class', 'sub-bar-label')
    .text(function(a) { return a[0]; });

subRow.append('td')
        .attr('class', 'sub-bar-container')
      .append('span')
        .attr('class', 'sub-bar-bar')
        .style('width', function(d) { 
          return subBarScale(d[1]) + '%' 
        })
        .style('background-color', function(d) {
          return subBarColor(d[1]);
        })

subRow.append('td')
      .attr('class', 'sub-bar-count')
      .text(function(a) { return a[1]; });

//
// Tooltip
//

function handleMouseOver(song) {
  var element = this;

}

function handleMouseOut(song) {

}
})();
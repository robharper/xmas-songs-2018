
function visualize(data, mainId, detailsId, mainField, maxSub, sub2018, sub2017) {

var isMobile = window.document.body.offsetWidth <= 420;

data.sort(function(a, b) {
  return (a.rank_2018 || 1000) - (b.rank_2018 || 1000)
});

var maxSub = 47;

var rankQuant = d3.scaleQuantize()
  .domain([0, 20])
  .range([1, 2, 3, 4, 5]);

var color = d3.scaleLinear()
  .domain([-20, 0, 20])
  .clamp(true)
  .range(['red', '#eee', 'green']);

var subBarScale = d3.scaleLinear()
  .domain([0, maxSub])
  .range([0, 100])

var subBarColor = d3.scaleLinear()
.domain([0, maxSub])
.range(['rgb(140, 130, 130)', 'rgb(184, 65, 51)'])


//
// Table
//
function updateAll() {
  var selection = d3.select(mainId + ' tbody')
    .selectAll('tr')
    .data(data, function(d) { 
      return d[mainField];
    });
    
  var trSong = selection.enter()
    .append('tr')
    .attr('id', function(d) {
      return d[mainField].replace(/\W/g, '-');
    })
    .attr('class', function(d) {
      var clazz = '';
      if (d.rank_change <= -1000) {
        clazz = 'song-removed';
      } else if (d.rank_change >= 1000) {
        clazz = 'song-added';
      }
      return clazz + ' song-row';
    });

if (isMobile) {
  trSong
    .on('click', toggleDetails)
} else {
  trSong
    .on('mouseover', handleMouseOver)
    .on('mouseout', handleMouseOut);
}

  trSong.append('td').attr('class', 'rank')
    .text(function(d, i) { return d.rank_2018; });

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
    .attr('class', 'song-rank-change-value')
    .text(function(d) { 
      if (d.rank_change <= -1000) {
        return d.rank_2017 - data.length + '*';
      } else if (d.rank_change >= 1000) {
        return 'New';
      } else {
        return (d.rank_change > 0 ? '+' : '') + d.rank_change 
      }
    })

  trSong.append('td')
    .attr('class', 'song-name')
    .attr('colspan', '2')
    .text(function(d) { return d[mainField]; })

  trSong.append('td').attr('class', 'play-count')
    .text(function(d) { 
      if (d.count_2018 > 0) {
        return d.count_2018; 
      } else {
        return '0';
      }
    });

  selection.exit().remove();
}

updateAll();
if (window.document.body.offsetWidth > 420) {
  var firstItem = d3.select(mainId + ' tbody tr').nodes()[0];
  firstItem.classList.add('selected');
  updateDetails(firstItem, data[0]);
}

d3.selectAll('th.rank')
  .on('click', function() {
    data.sort(function(a, b) {
      return (a.rank_2018 || 1000) - (b.rank_2018 || 1000)
    });
    d3.select(mainId + ' tbody').html('');

    d3.select(this).attr('class', 'rank selected');
    d3.select('th.song-rank-change').attr('class', 'song-rank-change');
    
    updateAll();
  })

d3.selectAll('th.song-rank-change')
  .on('click', function() {
    data.sort(function(a, b) {
      return b.rank_change - a.rank_change;
    });
    d3.select(mainId + ' tbody').html('');

    d3.select(this).attr('class', 'song-rank-change selected');
    d3.select('th.rank').attr('class', 'rank');

    updateAll();
  })

//
// Details
//
function updateDetails($element, d) {
  var tooltipOffset;
  if (isMobile) {
    tooltipOffset = $element.offsetTop + $element.offsetHeight;
  } else {
    tooltipOffset = $element.offsetTop;
  }

  var artists = d[sub2018] ? d[sub2018] : d[sub2017];

  artists.sort(function(a1, a2) { return a2[1] - a1[1]; });

  var tooltip = d3.select(detailsId)
    .style('top', tooltipOffset+'px')
    .style('visibility', 'visible')
    .attr('class', d[sub2018] ? 'details' : 'details details-removed')

  var selection = tooltip.select('table').selectAll('tr')
      .data(artists, function(d) { return d[0]+d[1]; })

  var row = selection.enter()
      .append('tr').attr('class', 'song-details')
  
  row.append('td').attr('class', 'sub-bar-padding')

  row.append('td')
      .attr('class', 'sub-bar-label')
      .text(function(a) { return a[0]; });

  row.append('td')
          .attr('class', 'sub-bar-container')
        .append('span')
          .attr('class', 'sub-bar-bar')
          .style('width', function(d) { 
            return subBarScale(d[1]) + '%' 
          })
          .style('background-color', function(d) {
            return subBarColor(d[1]);
          })

  row.append('td')
        .attr('class', 'sub-bar-count')
        .text(function(a) { return a[1]; });

  selection.exit().remove();
}

function handleMouseOver(song) {
  var nodes = d3.selectAll(mainId + ' tr').nodes();
  for (var i=0; i<nodes.length; i++) {
    nodes[i].classList.remove('selected');
  }
  d3.select(this).nodes()[0].classList.add('selected');
  
  updateDetails(this, song);

  d3.event.preventDefault();
}

function handleMouseOut(song) {
  d3.select(detailsId)
    .style('visibility', 'hidden');
}

function toggleDetails(song) {
  var active = d3.select(this).nodes()[0].classList.contains('selected');
  if (active) {
    handleMouseOut.call(this, song);
  } else {
    handleMouseOver.call(this, song);
  }
}
}
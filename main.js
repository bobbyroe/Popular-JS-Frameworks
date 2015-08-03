// data: https://data.stackexchange.com/stackoverflow/query/184560/generic-query-for-trending-multiple-tags
var log = console.log.bind(console);
var width = window.innerWidth;
var height = window.innerHeight;
var radius = Math.min(width, height) / 2;
var min_count_threshold = 100;
var tag_count_domain = {
    min: 1000000,
    max: 0
};
var current_month = '';
var libraries = [];
var available_dates = [];
var date = '2014-01';

var svg = d3.select(".panel").append("svg")
    .attr("width", width).attr("height", height);

d3.csv("js_libs.csv", function(error, data) {
    var tags = [];

    // stoke unique tags (library names)
    data.forEach( function (item, i) {
        if (tags.indexOf(item.TagName) === -1) {
            tags.push(item.TagName);
            libraries.push({
                tag: item.TagName,
                index: i,
                data: {}
            });
        }
    });

    // stoke unique dates
    data.forEach( function (item) {
        if (available_dates.indexOf(item.RoundToMonth) === -1) {
            available_dates.push(item.RoundToMonth);
        }

        // stoke date + data
        var index = tags.indexOf(item.TagName);
        lib = libraries[index];
        lib.data[item.RoundToMonth] = +item.TagCount;
    });
    
    // set the displayed date
    d.querySelector('#date').textContent = date;

    libraries.forEach( function (lib) {
        tag_count_domain.min = Math.min(tag_count_domain.min, lib.data[date]);
        tag_count_domain.max = Math.max(tag_count_domain.max, lib.data[date]);
    });

    var radius_scale = d3.scale.linear()
        .domain([tag_count_domain.min, tag_count_domain.max])
        .range([2.5, 250]);
    var hue = d3.scale.linear()
        .domain([tag_count_domain.min, tag_count_domain.max])
        .range([270, 0]);
    var force = d3.layout.force()
        .nodes(libraries).links([])
        .charge(function(d) { return radius_scale(d.data[date]) * -25; })
        .linkDistance(0).size([width, height]);

    // add the circles!
    var gs = svg.selectAll('g')
        .data(libraries).enter().append('g').call(force.drag);
    
    var circle = gs.append('circle')
        .attr('r', function (d) { return radius_scale(d.data[date]); })
        .attr("fill", function (d) { return d3.hsl(hue(d.data[date]), 1.0, 0.3); })
        .attr("stroke", function (d) { return d3.hsl(hue(d.data[date]), 1.0, 0.6); })
        .attr("stroke-width", 2);
    
    var text = gs.append('text')
        .attr("text-anchor", "middle")
        .attr('fill', '#e0e0e0').text(function (d, i) { return d.tag; })
        .attr('dx', function (d, i) { return 0; })
        .attr('dy', function (d, i) { return 20; })
        .style('font-size', '16px');
    
    var text_num = gs.append('text')
        .attr("text-anchor", "middle")
        .attr('fill', '#c0c0c0')
        .text(function (d, i) { return " (" + d.data[date] + ")"; })
        .attr('dx', function (d, i) { return 0; })
        .attr('dy', function (d, i) { return 40; })
        .attr('class', 'count-text')
        .style('font-size', '12px');

    force.on("tick", function() {
        svg.selectAll('g').attr("transform", function (d) { 
            return "translate(" + d.x + "," + d.y + ")";
        });
    });
    force.start();
});

function update () {

    // set the displayed date
    d.querySelector('#date').textContent = date;

    libraries.forEach( function (lib) {
        tag_count_domain.min = Math.min(tag_count_domain.min, lib.data[date]);
        tag_count_domain.max = Math.max(tag_count_domain.max, lib.data[date]);
    });

    var radius_scale = d3.scale.linear()
        .domain([tag_count_domain.min, tag_count_domain.max])
        .range([2.5, 250]);
    var hue = d3.scale.linear()
        .domain([tag_count_domain.min, tag_count_domain.max])
        .range([270, 0]);
    var force = d3.layout.force()
        .nodes(libraries).links([])
        .charge(function(d) { 
            return radius_scale(d.data[date]) * -25; 
        })
        .linkDistance(0).size([width, height]);

    // add the circles!
    var transition = svg.transition().duration(500);

    transition.selectAll("g")
    .select('circle')
        .delay(function(d, i) { return i * 10; })
        .attr('r', function (d) { return radius_scale(d.data[date]); })
        .attr("fill", function (d) { return d3.hsl(hue(d.data[date]), 1.0, 0.3); })
        .attr("stroke", function (d) { return d3.hsl(hue(d.data[date]), 1.0, 0.6); });

    svg.selectAll("g").select('.count-text')
        .text(function (d, i) { return " (" + d.data[date] + ")"; });

    svg.selectAll("g").select("g").call(force.drag);

    force.on("tick", function() {
        svg.selectAll('g').attr("transform", function (d) { 
            return "translate(" + d.x + "," + d.y + ")";
        });
    });
    force.start();
}

var d = document;
var panel = d.querySelector('.panel');
var info_panel = d.querySelector('#info');

function showInfoPanel () {
    var is_highlighing_points;
    panel.classList.add('scooched_right');
    info_panel.classList.add('open');
    is_highlighing_points = false;
}

function hideInfoPanel () {
    var is_highlighing_points;
    panel.classList.remove('scooched_right');
    info_panel.classList.remove('open');
    is_highlighing_points = true;
}

function toggleInfoPanel () {
    if (info_panel.classList.contains('open')) {
        hideInfoPanel();
    } else {
        showInfoPanel();
    }
}

function randomizeDate () {
    var i = Math.floor(Math.random() * available_dates.length);
    date = available_dates[i];
    update();
}

function clicked (evt) {
    if (evt.target.id === 'nub') {
        toggleInfoPanel();
    }
    if (evt.target.id === 'date') {
        hideInfoPanel();
        randomizeDate();
    }
}

d.addEventListener('click', clicked);

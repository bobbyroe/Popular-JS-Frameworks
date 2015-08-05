// data: https://data.stackexchange.com/stackoverflow/query/184560/generic-query-for-trending-multiple-tags
(function () {

    "use strict";
    var log = console.log.bind(console);
    var width = window.innerWidth;
    var height = window.innerHeight;
    var tag_count_domain = {
        min: 1000000,
        max: 0
    };
    var libraries = [];
    var left_offset_bit = 0;
    var dates = (function () {
        var date_inc = 0;
        var available = [];
        var current = '';
        var prior = '';
        var readable = '';
        var months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July',
            'August', 'September', 'October', 'November', 'December'];
        function decrement () {
            date_inc += 1;
            if (date_inc >= available.length) date_inc = 0;
            current = available[date_inc];
            readable = months[+current.substring(5, 7)] +
                ' ' + current.substring(0, 4);
            prior = (date_inc === available.length - 1) ? available[available.length - 1] :
                available[date_inc + 1];
        }

        function increment () {
            date_inc -= 1;
            if (date_inc < 0) date_inc = available.length - 1;
            current = available[date_inc];
            readable = months[+current.substring(5, 7)] +
                ' ' + current.substring(0, 4);
            prior = (date_inc === available.length - 1) ? available[available.length - 1] :
                available[date_inc + 1];
        }
        return {
            get current () { return current; },
            set current (val) { current = val; return val; },
            get readable () { return readable; },
            get inc () { return date_inc; },
            get prior () { return prior; },
            available: available,
            decrement: decrement,
            increment: increment
        };
    })();
    window.dates = dates;

    var svg = d3.select(".panel").append("svg")
        .attr("width", width).attr("height", height);

    function init (error, data) {
        var tags = [];

        // stoke unique tags (library names)
        data.forEach( function (item) {
            if (tags.indexOf(item.TagName) === -1) {
                tags.push(item.TagName);
                libraries.push({
                    tag: item.TagName,
                    data: {}
                });
            }
        });

        // stoke unique dates
        data.forEach( function (item) {
            if (dates.available.indexOf(item.RoundToMonth) === -1) {
                dates.available.push(item.RoundToMonth);
            }

            // stoke date + data
            var index = tags.indexOf(item.TagName);
            var lib = libraries[index];
            lib.data[item.RoundToMonth] = +item.TagCount;

            // set min and max
            tag_count_domain.min = Math.min(tag_count_domain.min, +item.TagCount);
            tag_count_domain.max = Math.max(tag_count_domain.max, +item.TagCount);
        });
        
        // set the displayed date
        var date = dates.current = dates.available[dates.available.length - 1]; // initialize
        dates.increment(); // initialize
        left_offset_bit = Math.round(width / (dates.available.length * 2));
        var date_div = doc.querySelector('#date');
        date_div.textContent = dates.readable;
        date_div.style.marginLeft = 0;

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
    }

    // UPDATE
    function update (opts) {
        if (opts == null) opts = {};
        var date = dates.current;
        // set the displayed date
        var date_div = doc.querySelector('#date');
        date_div.textContent = dates.readable;
        date_div.style.marginLeft = (dates.available.length - dates.inc) *
            left_offset_bit + 'px';

        var count_diff_domain = {
            min: 1000000,
            max: 0
        };
        libraries.forEach( function (lib) {
            var diff = lib.data[dates.current] - lib.data[dates.prior];
            // set min and max
            count_diff_domain.min = Math.min(count_diff_domain.min, diff);
            count_diff_domain.max = Math.max(count_diff_domain.max, diff);
        });

        var radius_scale = d3.scale.linear()
            .domain([tag_count_domain.min, tag_count_domain.max])
            .range([2.5, 250]);
        var hue = d3.scale.linear()
            .domain([count_diff_domain.min, count_diff_domain.max])
            .range([0, 180]);
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
            .attr("fill", function (d) { 
                var diff = d.data[dates.current] - d.data[dates.prior]; 
                return d3.hsl(hue(diff), 1.0, 0.3); 
            })
            .attr("stroke", function (d) {
                var diff = d.data[dates.current] - d.data[dates.prior]; 
                return d3.hsl(hue(diff), 1.0, 0.6); 
            });

        svg.selectAll("g").select('.count-text')
            .text(function (d, i) {
                var diff = d.data[dates.current] - d.data[dates.prior]; 
                return " (" + d.data[dates.current] + ")"; 
            });

        svg.selectAll("g").select("g").call(force.drag);

        var nudge_left = opts.nudge === 'left';
        var nudge_right = opts.nudge === 'right';
        var nudge_scale = d3.scale.linear()
            .domain([tag_count_domain.min, tag_count_domain.max])
            .range([20.0, 0.0]);
        force.on("tick", function() {
            svg.selectAll('g').attr("transform", function (d) {
                if (nudge_left === true) {
                    d.x -= nudge_scale(d.data[date]);
                }
                if (nudge_right === true) {
                    d.x += nudge_scale(d.data[date]);
                }
                return  "translate(" + d.x + "," + d.y + ")";
            });
            nudge_left = false;
            nudge_right = false;
        });
        force.start();
    }

    var doc = document;
    var $body = $('body');
    var panel = doc.querySelector('.panel');
    var info_panel = doc.querySelector('#info');

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
            update({nudge: 'right'});
        } else {
            showInfoPanel();
            update({nudge: 'left'})
        }
    }

    //
    // EVENTS
    //
    
    function clicked (evt) {
        if (evt.target.id === 'nub') {
            toggleInfoPanel();
        }
        if (evt.target.id === '') {
            hideInfoPanel({nudge: 'right'});
        }
    }

    function keydowned (evt) {
        if (evt.keyCode === 37) { // left arrow
            dates.decrement();
            update();
        }
        if (evt.keyCode === 39) { // right arrow
            dates.increment();
            update();
        }
        if (evt.keyCode === 90) { // 'z'
            if (evt.shiftKey === true) {
                update({nudge: 'right'});
            } else {
                update({nudge: 'left'});
            }
            
        }
    }

    function onSwipeLeft (evt) {
        if (evt.target.tagName === 'circle') return; // ignore draged circles
        dates.decrement(); update(); 
    }
    function onSwipeRight (evt) {
        if (evt.target.tagName === 'circle') return; // ignore draged circles
        dates.increment(); update(); }
    function onTouchStart (evt) { evt.preventDefault(); 
    } // no native scrolling
    function onTouchMove (evt) { evt.preventDefault(); }
    function onTouchEnd (evt) { evt.preventDefault(); }

    doc.addEventListener('click', clicked);
    doc.addEventListener('keydown', keydowned);

    // swiping
    $body.on('swipeleft', onSwipeLeft);
    $body.on('swiperight', onSwipeRight);
    $body.on('touchstart', onTouchStart);
    $body.on('touchmove', onTouchMove);
    $body.on('touchend', onTouchEnd);

    // go!
    $(function () { d3.csv("js_libs.csv", init); });
})();


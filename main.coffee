log = console.log.bind(console)
width = window.innerWidth
height = window.innerHeight
radius = Math.min(width, height) / 2
min_count_threshold = 100
tag_count_domain = 
    min: 1000000
    max: 0


svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)

d3.csv "js_libs.csv", (error, data) ->
    tags = []
    libraries = []

    for item, i in data
        if tags.indexOf(item.TagName) is -1
            tags.push item.TagName
            libraries.push { tag: item.TagName, count: 0 }

    for item, i in data
        index = tags.indexOf(item.TagName)
        if index isnt -1
            libraries[index].count += +item.TagCount

    # for lib in [libraries.length-1..0] by -1
    #     if lib.count < min_count_threshold
    #         libraries.splice i, 1
    libraries = libraries.filter (d) -> return d.count > min_count_threshold
    # log libraries

    for lib in libraries
        tag_count_domain.min = Math.min tag_count_domain.min, lib.count
        tag_count_domain.max = Math.max tag_count_domain.max, lib.count
               
    radius_scale = d3.scale.linear()
        .domain([tag_count_domain.min, tag_count_domain.max])
        .range([2.5, 250])

    hue = d3.scale.linear()
        .domain([tag_count_domain.min, tag_count_domain.max])
        .range([270, 0])
    
    force = d3.layout.force()
        .nodes(libraries)
        .links([])
        .charge( (d) -> radius_scale(d.count) * -25 )
        .linkDistance(0)
        .size([width, height])

    # add the circles!
    gs = svg.selectAll('g')
        .data(libraries)
        .enter()
        .append('g')
        .call(force.drag)

    circle = gs.append('circle')
            .attr('r', (d) -> radius_scale d.count )
            # .attr('r', (d) -> d.count * 0.02)
            .attr("fill", (d) -> d3.hsl(hue(d.count), 1.0, 0.3) )
            .attr("stroke", (d) -> d3.hsl(hue(d.count), 1.0, 0.6) )
            .attr("stroke-width", 2)
    text = gs.append('text')
            .attr("text-anchor", "middle")
            .attr('fill', '#e0e0e0')
            .text( (d, i) -> d.tag)
            .attr('dx', (d, i) -> 0 )
            .attr('dy', (d, i) -> 20 )
            .style('font-size', '16px')
    text_num = gs.append('text')
            .attr("text-anchor", "middle")
            .attr('fill', '#c0c0c0')
            .text( (d, i) ->  " (#{d.count})" )
            .attr('dx', (d, i) -> 0 )
            .attr('dy', (d, i) -> 40 )
            .style('font-size', '12px')


    force.on("tick", () ->
        svg.selectAll('g')
            .attr("transform",(d) -> "translate("+ d.x + "," + d.y + ")")
    )
    force.start()



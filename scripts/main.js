var margin = {top: 20, right: 80, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var xScale = d3.scale.linear()
    .range([0, width]);

var yScale = d3.scale.linear()
    .range([height, 0]);

var ordinal = d3.scale.ordinal();

var xAxis = d3.svg.axis()
    .scale(xScale)
    .ticks(0)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(yScale)
    .ticks(7)
    .tickSize(width, 0)
    .orient("right");

var line = d3.svg.line()
    .x(function(d) { return xScale(d.year); })
    .y(function(d) { return yScale(d.rice); });

var svg = d3.select("#chart-container").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var getColor = function(country_name){
  var colors = {
    India : "#FABE9C",
    Vietnam : "#F6AB9A",
    Thailand : "#FED47D"
  }
  return colors[country_name];
};

var toggleVisibility = function(country_name){
  $("g").find("[data-name='" + country_name + "']").toggle();
};

d3.csv("milledRiceEndingStocks.csv", function(error, data) {
  if (error) throw error;

  var all_keys = d3.keys(data[0]);
  var country_names = all_keys.filter(function(key){return key !== 'Year'; });

  ordinal.domain(country_names);
  data.forEach(function(d) {
    d.year = +d.Year;
  });

  country_data_map = country_names.map(function(name) {
    return {
      name: name,
      values: data.map(function(d) {
        return {
          year: +d["Year"],
          rice: +d[name]
        };
      }),
      visibility: true
    };
  });

  console.log(country_data_map);

  xScale.domain(d3.extent(data, function(d) { return d.year; }));

  yScale.domain([
    d3.min(country_data_map, function(c) { return d3.min(c.values, function(v) { return v.rice; }); }),
   30000
  ]);

  country_names.forEach(function(country_name){
    d3.select('#countries-list')
    .append('li')
    .html(country_name)
    .attr('class', 'country_label')
    .attr("data-name", country_name)
    .on("click", function(){
      toggleVisibility(country_name);
    });
  });

/*
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height+ ")")
      .call(xAxis);
*/
  var gy = svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);

  gy.selectAll("text")
    .attr("x", 4)
    .attr("dy", -4)
    .attr('font-family', "curator-regular")
    .attr('font-size', '13px')
    .attr('fill', '#333333');

  var country = svg.selectAll(".country")
      .data(country_data_map)
      .enter()
      .append("g")
      .attr("class", "country")
      .attr("data-name", function(d){ return d.name; });

  country.append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.values); })
      .attr('stroke-width', '2pt')
      .attr('stroke', function(d){ return getColor(d.name)});
});

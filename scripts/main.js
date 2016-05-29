Model = {
	init: function() {
		var that = this;
		d3.csv("milledRiceEndingStocks.csv", function(error, data) {
			if (error) {
				throw error;
			}

			var all_keys = d3.keys(data[0]);
			var country_names = all_keys.filter(function(key) {
				return key !== 'Year';
			});

			data.forEach(function(d) {
				d.year = +d.Year;
			});

			that.data = country_names.map(function(name) {
				return {
					name: name,
					visibility: true,
					values: data.map(function(d) {
						return {
							year: +d.year,
							rice: +d[name]
						};
					})
				};
			});

      Chart.init();
		});
	},

	getData: function() {
		return this.data.filter(function(country_data) {
			return country_data.visibility !== false;
		});
	},

  toggleCountryVisibility(country_name){
    this.data.forEach(function(d){
      if(d.name == country_name){
        d.visibility = !d.visibility;
      }
    });
  },

	getVisibility(country_name){
		var visibility;
		this.data.forEach(function(d){
      if(d.name == country_name){
        visibility = d.visibility;
      }
    });
		return visibility;
	}
};

Chart = {
	getLineColor: function(country_name) {
      var colors = {
    		India: "#FABE9C",
    		Vietnam: "#F6AB9A",
    		Thailand: "#FED47D"
    	}
		return colors[country_name];
	},

	init: function() {
    var that = this;
		this.paths = [];
		this.circleSvgMap = {};
    this.data = Octopus.getData();
		this.margin = {
				top: 50,
				right: 20,
				bottom: 20,
				left: 20
			};
		this.width = 622.5 - this.margin.left - this.margin.right;
		this.height = 300 - this.margin.top - this.margin.bottom;

		this.xScale = d3.scale.linear()
			.range([0, this.width]);
		this.yScale = d3.scale.linear()
			.range([this.height, 0]);
    this.updateScale();

    this.xAxis = d3.svg.axis()
    .scale(this.xScale)
    .orient("bottom")
    .ticks(5);

		this.yAxis = d3.svg.axis()
			.scale(this.yScale)
			.ticks(7)
			.tickSize(this.width)
			.orient("right");

		this.line = d3.svg.line()
			.interpolate("linear")
			.x(function(d) {
				return this.xScale(d.year);
			})
			.y(function(d) {
				return this.yScale(d.rice);
			});

		this.render();
	},

	render: function() {
    var that = this;
		this.svg = d3.select("#chart-container").append("svg")
			.attr("viewBox", "0 0 " + (this.width + this.margin.left + this.margin.right) + " " + (this.height + this.margin.top + this.margin.bottom))
      .on("click", function(){
          var coords = d3.mouse(this);
          var val = {
            x: that.xScale.invert(coords[0]),
            y: that.yScale.invert(coords[1])
          }
          that.drawVerticalLine(coords[0]);
					that.drawCircles(coords);
      })
			.append("g")

    this.data.forEach(function(d){
      d3.select('#countries-list')
        .append('li')
        .html('<span data-name="' + d.name + '">&mdash; </span>' + d.name)
        .attr('class', 'country_label')
        .attr("data-name", d.name)
        .on("click", function(){
          that.toggleCountryVisibility(d.name);
        })
    });

		var gx = this.svg.append("g")
			.attr("class", "x axis")
      .attr('transform', 'translate(0,' + (this.height) + ')')
			.call(this.xAxis);

		var gy = this.svg.append("g")
			.attr("class", "y axis")
			.call(this.yAxis);

		gy.selectAll("text")
			.attr("x", 4)
			.attr("dy", -4);

		var country = this.svg.selectAll(".country")
			.data(this.data)
			.enter()
			.append("g")
			.attr("class", "country")

		this.paths = country.append("path")
			.attr("class", "line")
			.attr("d", function(d) {
				return that.line(d.values);
			})
      .attr("data-name", function(d) {
				return d.name;
			})
			.attr('stroke-width', '2pt')
			.attr('stroke', function(d) {return that.getLineColor(d.name)});
	},

  updateScale : function(){
    var that = this;
    this.xScale.domain([
			d3.min(this.data, function(c) {
				return d3.min(c.values, function(v) {
					return v.year;
				});
			}),
      d3.max(this.data, function(c) {
				return d3.max(c.values, function(v) {
					return v.year;
				});
			})
		]);

		this.yScale.domain([
      0,
      d3.max(that.data, function(c) {
        return d3.max(c.values, function(v) {
          return v.rice;
        });
      })
		]);
  },

  redraw : function(){
    var that = this;
    this.data = Model.getData();
    this.updateScale();
		this.hideCircles();
		this.hideVerticalLine();
    this.data.forEach(function(d){
      that.svg.select("path[data-name=" + d.name + "]")
         .transition()
         .ease("sin-in-out")
         .duration(750)
         .attr("d", function(d) {
   				    return that.line(d.values);
	       });
    });
    var gy = this.svg.select(".y.axis")
          .transition()
          .duration(1000)
          .call(this.yAxis)
          .selectAll("text") // cancel transition on customized attributes
          .tween("attr.x", null)
          .tween("attr.dy", null);

    $('g.y.axis').find('text')
    .attr("x", 4)
    .attr("dy", -4);
  },

  toggleCountryVisibility : function(country_name){
    $("path[data-name=" + country_name + "]").toggle();
    Octopus.toggleCountryVisibility(country_name);
    this.redraw();
  },

  drawVerticalLine : function(x){
    if(typeof this.verticalLine === 'undefined'){
      this.verticalLine = this.svg.append('line');
    }
    this.verticalLine
    .attr({
      'x1' : x,
      'y1' : 0,
      'x2' : x,
      'y2' : this.height,
    })
    .attr("stroke", "steelblue")
		.attr("stroke-width", "2pt")
    .attr('class', 'verticalLine')
		.style('display', 'inline');
  },

	hideVerticalLine : function(){
		$('line.verticalLine').hide();
	},

	drawCircles : function(coords){
		var that = this;
		var x = coords[0];
		var y = coords[1];

		this.paths.each(function(d){
			if(!Octopus.getVisibility(d.name)){
				return;
			}
			var pathLength = this.getTotalLength();
			var beginning = x, end = pathLength, target_length;
			var circle;

			while(true){
				target_length = Math.floor((beginning + end)/2);
				var target_coordinate = this.getPointAtLength(target_length);
				if ((target_length === end || target_length === beginning) && target_coordinate.x !== x) {
					break;
				}
				if(target_coordinate.x > x){
					end = target_length;
				} else if(target_coordinate.x < x){
					beginning = target_length;
				} else{
						break;
				}
			}

			if(typeof that.circleSvgMap[d.name] === 'undefined'){
				circle = that.svg.append("circle");
				that.circleSvgMap[d.name] = circle;
			} else {
				circle = that.circleSvgMap[d.name];
			}

			circle
			.attr("opacity", 1)
			.attr("cx", target_coordinate.x)
			.attr("cy", target_coordinate.y)
			.attr("r", 6)
			.attr("fill", that.getLineColor(d.name))
			.style('display', 'inline');
		})
	},

	hideCircles : function(){
		$("circle").hide();
	},
}

Octopus = {
  init : function() {
    Model.init();
  },
	getData: function() {
		return Model.getData();
	},
  // getDataMap : function() {
  //   return Model.getDataMap();
  // },
  // getCountryNames : function(){
  //   return Model.getCountryNames();
  // },
  toggleCountryVisibility : function(country_name){
    Model.toggleCountryVisibility(country_name);
  },

	getVisibility : function(country_name){
		return Model.getVisibility(country_name);
	}
}

Octopus.init();

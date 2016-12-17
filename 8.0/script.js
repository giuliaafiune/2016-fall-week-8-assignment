console.log('8.3');

var m = {t:100,r:100,b:100,l:100};
var outerWidth = document.getElementById('canvas').clientWidth,
    outerHeight = document.getElementById('canvas').clientHeight;
var w = outerWidth - m.l - m.r,
    h = outerHeight - m.t - m.b;

var plot = d3.select('.canvas')
    .append('svg')
    .attr('width',outerWidth)
    .attr('height',outerHeight)
    .append('g')
    .attr('transform','translate(' + m.l + ',' + m.t + ')');

//d3.set creates a new array with just unique airline names because we are grouping flights by airline
var airlines = d3.set();

//Scale
var scaleX = d3.scaleTime()
    .range([0,w]);
var scaleColor = d3.scaleOrdinal()
    .range(['#fd6b5a','#03afeb','orange','#06ce98','blue']);
var scaleY = d3.scaleLinear()
    .domain([0,1000])
    .range([h,0]);

//Axis
var axisX = d3.axisBottom()
    .scale(scaleX)
    .tickSize(-h);
var axisY = d3.axisLeft()
    .scale(scaleY)
    .tickSize(-w);

//Line generator
var lineGenerator = d3.line()
    .x(function(d){return scaleX(d.travelDate)})
    .y(function(d){return scaleY(d.price)})
    .curve(d3.curveCardinal);

d3.queue()
    .defer(d3.csv, '../data/bos-sfo-flight-fare.csv',parse)
    .await(function(err, data){

        console.log(data);

        //Mine the data to set the scales
        scaleX.domain( d3.extent(data,function(d){return d.travelDate}) );
        scaleColor.domain( airlines.values() );

        //Add buttons
        d3.select('.btn-group')
            .selectAll('.btn')
            .data( airlines.values() , function(d){ return d.id; }) // this interprets the id column as the key column
            .enter()
            .append('a')
            .html(function(d){return d;})
            .attr('href','#')
            .attr('class','btn btn-default')
            .style('color','white')
            .style('background',function(d){return scaleColor(d)})
            .style('border-color','white')
            .on('click',function(d){

                draw(data.filter( function (d) { 

                    return d.airline = d.key;

                }));

                //Hint: how do we filter flights for particular airlines?
                //data.filter(...)

                //How do we then update the dots?
            });

        //Draw axis
        plot.append('g').attr('class','axis axis-x')
            .attr('transform','translate(0,'+h+')')
            .call(axisX);
        plot.append('g').attr('class','axis axis-y')
            .call(axisY);

        draw(data);

    });

function draw(rows){

    //IMPORTANT: data transformation
    var flightsByTravelDate = d3.nest().key(function(d){return d.travelDate})
        .entries(rows);

    flightsByTravelDate.forEach(function(day){
       day.averagePrice = d3.mean(day.values, function(d){return d.price});
    });

    console.log(flightsByTravelDate);
    console.log(rows);

    //Draw dots

    var nodes = plot.selectAll(".dot")
        .data(rows) // UPDATE 

    //Enter
    var nodesEnter = nodes.enter() //ENTER
        .append("circle")
        .attr("class","dot");

    //Exit
    nodes.exit().remove();

    //Update
    var nodesTransition = nodes
        .merge(nodesEnter) // UPDATE+ENTER
        .transition().duration(1000)
        .attr("r",5)
        .attr('cx',function(d){return scaleX(d.travelDate)})
        .attr('cy',function(d){return scaleY(d.price)})
        .style('fill',function(d){return scaleColor(d.airline)})
        .on('mouseenter',function(d){
            var tooltip = d3.select('.custom-tooltip'); // creates a new div with this class. It cointains two other divs (title and value)
            tooltip.select('.title')
                .html("This flight's price is")
            tooltip.select('.value')
                .html(d.price);

            tooltip.transition().style('opacity',1);

            d3.select(this).style('stroke-width','3px');
        })
        .on('mousemove',function(d){
            var tooltip = d3.select('.custom-tooltip');
            var xy = d3.mouse( d3.select('.container').node() );
            tooltip
                .style('left',xy[0]+10+'px')
                .style('top',xy[1]+10+'px');
        })
        .on('mouseleave',function(d){
            var tooltip = d3.select('.custom-tooltip');
            tooltip.transition().style('opacity',0);

            d3.select(this).style('stroke-width','0px');
        })
        .on("click", function (d) { 

            draw(data.filter( function (d) { 

                return d.airline = d.key;

            }));


            var tooltip = d3.select('.custom-tooltip');
            tooltip.select('.title')
                .html(d.airline)
            tooltip.select('.value')
                .html(d.price);
            var xy = d3.mouse( d3.select('.container').node() );
            tooltip
                .style('left',xy[0]+10+'px')
                .style('top',xy[1]+10+'px');
        });


    //Draw <path>


    var path = plot.selectAll(".time-series")
        .datum(rows)
        .append("path")
        .transition()
        .attr("class","time-series")
        .attr('d',function(datum){
            return lineGenerator(datum.sort());
        })
        .style('fill','none')
        .style('stroke-width','2px')
        .style('stroke',function(datum){
            return scaleColor(datum[0].airline);
        });

}


function parse(d){

    if( !airlines.has(d.airline) ){
        airlines.add(d.airline);    // this populates the new array that we created on the top. Creates the new unique airline array
    }

    return {
        airline: d.airline,
        price: +d.price,
        travelDate: new Date(d.travelDate),
        duration: +d.duration,
        id: d.id
    }
}
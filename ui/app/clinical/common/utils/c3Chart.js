"use strict";

var Bahmni = Bahmni || {};
Bahmni.Graph = Bahmni.Graph || {};

Bahmni.Graph.c3Chart = function () {
    var dateUtil = Bahmni.Common.Util.DateUtil;

    var createReferenceClasses = function (data) {
        var classes = {};
        _.each(data, function (datum) {
            if (datum.reference) {
                classes[datum.name] = 'reference-line';
            }
        });
        return classes;
    };

    var createXAxisConfig = function (config) {
        return {
            label: {
                text: config.xAxisConcept + (config.unit || ''),
                position: 'outer-right'
            },
            type: config.type,
            tick: {
                fit: true,
                culling: {
                    max: 3
                },
                format: function (xAxisConcept) {
                    return config.displayForObservationDateTime() ? dateUtil.formatDateWithoutTime(xAxisConcept) : xAxisConcept;
                }
            }
        }
    };

    var createYAxisConfig = function (unit) {
        return {
            label: {
                text: unit,
                position: 'outer-top'
            },
            tick: {
                culling: {
                    max: 3
                },
                format: function (y) {
                    return d3.round(y, 2);
                }
            },
            show: true
        }
    };

    var createAxisConfig = function(config, units) {
        var axis = {
            x: createXAxisConfig(config),
            y: createYAxisConfig(units[0])
        };
        if(units[1] != undefined) {
            axis['y2'] = createYAxisConfig(units[1]);
        }
        return axis;
    }

    var createGridConfig = function(config) {
        var grid = {
            y: {
                lines: []
            }
        };
        if (config.yAxisConcepts.length == 1) {
            if (config.lowNormal != undefined) {
                grid.y.lines.push({value: config.lowNormal, text: "low", class: "lowNormal"});
            }
            if (config.hiNormal != undefined) {
                grid.y.lines.push({value: config.hiNormal, text: "high", class: "hiNormal"});
            }
        }
        return grid;
    };

    var createConfigForToolTipGroupingFix = function(config) {
        var xs = {};
        config.yAxisConcepts.forEach(function (yAxisConcept) {
            xs[yAxisConcept] = config.xAxisConcept;
        });
        return xs;
    };

    var createConfigForAxes = function (data, units) {
        var axes = {};
        createAxisAndPopulateAxes(axes, data, 'y', units[0]);
        createAxisAndPopulateAxes(axes, data, 'y2', units[1]);
        return axes;
    };

    var createAxisAndPopulateAxes = function (axes, data, axisY, unit) {
        if (!unit) return;
        _.each(data, function (item) {
            if (item.units === unit) {
                axes[item.name] = axisY;
            }
        });
    };

    this.render = function (bindTo, graphWidth, config, data) {
        var distinctUnits = _.uniq(_.pluck(data, 'units'));
        if (distinctUnits.length > 2) {
            throw new Error("Cannot display line graphs with concepts that have more than 2 units");
        }

        var allPoints = _(data).reduce(function (accumulator, item) {
            return accumulator.concat(item.values);
        }, []);

        var c3Chart;
        var c3Config = {
            bindto: bindTo,
            size: {
                width: graphWidth
            },
            padding: {
                top: 20,
                right: 50
            },
            data: {
                json: allPoints,
                keys: {
                    x: config.xAxisConcept,
                    value: config.yAxisConcepts
                },
                axes: createConfigForAxes(data, distinctUnits),
                xs: createConfigForToolTipGroupingFix(config),
                onclick: function (d) {
                    c3Chart.tooltip.show({data: d});
                },
                classes: createReferenceClasses(data)
            },
            point: {
                show: true,
                r: 5,
                sensitivity: 20
            },
            line: {
                connectNull: true
            },
            axis: createAxisConfig(config, distinctUnits),
            tooltip: {
                grouped: true,
                format: {
                    title: function (xAxisConcept) {
                        return config.displayForObservationDateTime() ?
                            dateUtil.formatDateWithTime(xAxisConcept) : (config.xAxisConcept + " " + xAxisConcept);
                    }
                }
            },
            zoom: {
                enabled: true
            },
            transition_duration: 0,
            grid: createGridConfig(config)
        };
        c3Chart = c3.generate(c3Config);
        return c3Chart;
    };
};

Bahmni.Graph.c3Chart.create = function() {
    return new Bahmni.Graph.c3Chart();
}

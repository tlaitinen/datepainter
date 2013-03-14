/* Copyright (C) 2013 Tero Laitinen

   See LICENSE for details. */
"use strict";
(function($) {
    $.widget("datepainter.datepainter", {
        // default options
        options: {
        },
        _createYearSelect : function(firstYear, lastYear) {

            var yearSelect = $("<select>");

            // options in year-select
            for (var y = firstYear; y <= lastYear; y++) {

                yearSelect.append($("<option>")
                    .attr("value", y)
                    .text(y));

            }
            return yearSelect;
        },

        _createMonthSelect : function() {
            var monthSelect = $("<select>");



            // options in month-select
            for (var m = 0; m < 12; m++) {

                var option =  $("<option>")
                    .attr("value", m)
                    .text(moment().month(m).format('MMMM'));

                monthSelect.append(option);

            }
            return monthSelect;
        },

        _createHeaderRow: function(cal, cells) {


            var headerRow = $("<tr>");
            for (var col = 0; col < 8; col++) {
                var text = "";
                if (col > 0) {
                    text =  moment().day(col).format("ddd");

                }

                var th = $('<th>');
                th.text(text)
                    .disableSelection();
                if (col > 0) {
                    th.addClass('datepainter-cell');
                    cells['0-' + col] = th;
                } else {
                    th.append($("<button>").html('<i class="icon-remove"/>')
                      .click(function (e) { cal.clearSelected();}));

                }

                headerRow.append(th);

            }
            return headerRow;
        },

        _registerMouseTriggersCell: function(cal, cell, row, col) {
           cell.mouseenter(function(e) {
                    cal._onMouseEnter(row, col);
                })
               .mouseleave(function(e) {
                   cal._onMouseLeave(row, col);
               })
                .mousedown(function(e) {
                    cal._onMouseDown(row, col);
                });
        },

        _registerMouseTriggers: function(cal, cells) {
            for (var row = 0; row < 7; row++) {
                for (var col = 0; col < 8; col++) {
                    if (row == 0 && col == 0)
                        continue;
                    this._registerMouseTriggersCell(cal, cells[this._cellId(row, col)], row, col);

                }
            }

        },

        _cellId: function(row, col) {
            return row + '-' + col;

        },

        _makeCellGroups: function(cells) {
            var groups = {};
            for (var row = 0; row < 7; row++) {
                for (var col = 0; col < 8; col++) {
                    groups[this._cellId(row, col)] = [];
                }
            }
            for (var row = 0; row < 7; row++) {
                for (var col = 0; col < 8; col++) {
                    if (row > 0 && col > 0) {
                        var pos = [row, col];
                        groups[this._cellId(row, col)].push(pos);
                        groups[this._cellId(0, col)].push(pos);
                        groups[this._cellId(row, 0)].push(pos);
                    }
                }
            }

            return groups;
        },

        // the constructor
        _create: function() {
            var cal = this;

            var now = moment();
            this.firstYear = now.year() - 5;
            this.lastYear = now.year() + 5;
            // create drop-down for selecting year and month
            this.yearSelect = this._createYearSelect(this.firstYear, this.lastYear).val(now.year());
            this.monthSelect = this._createMonthSelect().val(now.month());
            this._mouseState = ''; // '', 'set', 'unset'
            this.selected = {}


              // create week day titles for the calendar

            this._cells = {};
            var headerRow = this._createHeaderRow(this, this._cells);

            var tbody = $("<tbody>");
            // at most six weeks in a month, one per row
            for (var row = 1; row < 7; row++) {
                var tr = $("<tr>").appendTo(tbody);
                // week number and seven days
                for (var col = 0; col < 8; col++) {
                    var td = $("<td>")
                    if (col == 0) {
                        td.addClass('datepainter-week-cell')
                            .addClass('datepainter-cell');
                    } else {
                        td.addClass('datepainter-cell');

                    }



                    this._cells[this._cellId(row, col)] = td;

                    tr.append(td);
                }
            }

            this._registerMouseTriggers(cal, this._cells);
            this._cellGroups = this._makeCellGroups(this._cells);



            var prevMonthButton = $("<button>").html('<i class="icon-arrow-left"/>');
            var nextMonthButton = $("<button>").html('<i class="icon-arrow-right"/>');

            this.calendar = $("<table>")
                .appendTo(this.element)
                .append(
                    $("<thead>")
                        .append(
                            $("<tr>")
                                .append(
                                    $('<th>')
                                        .append(prevMonthButton)
                                )
                                .append(
                                    $('<th>')
                                        .attr("colspan", "4")
                                        .append(this.monthSelect)
                                )
                                .append(
                                    $('<th>')
                                        .attr("colspan", "2")
                                        .append(this.yearSelect)
                                )
                                .append(
                                    $('<th>')
                                        .append(nextMonthButton)
                                )

                        )
                        .append(headerRow)
                )
                .append(tbody);
            this.selectionList = $('<ul>').appendTo(this.element);



            $(document).mouseup(function() { cal._onMouseUp(); });


            this.yearSelect.change(function() { cal._refresh(); });
            this.monthSelect.change(function() { cal._refresh(); });
            prevMonthButton.click(function() {
                cal.addMonths(-1);
            });
            nextMonthButton.click(function() {
                cal.addMonths(1);
            });

            this.calendar
                // add a class for theming
                .addClass( "datepainter" );
                // prevent double click to select text

            tbody.disableSelection();

            this._refresh();
        },

        _getDate: function(row, col) {
            // calculate which date is the first visible Monday
            // in calendar
            if (row < 1 || row > 7 || col < 1 || col > 7)
                return undefined;
            var currentMonth = this.selectedMonth();
            var date = moment().year(this.selectedYear()).month(currentMonth).date(1).hours(0).minutes(0).seconds(0);

            var wday = (date.day()+6) % 7;
            if (wday > 0) {
                date.subtract('days', wday);
            }
            date.add('weeks',row-1);
            date.add('days',col-1);
            return date;
        },

        _onMouseEnter: function(row, col) {
            this._setHighlight(row, col, true);

            if (this._mouseState == '')
                return;
            this._toggleCellGroupSelection(row, col);

        },

        _onMouseLeave: function(row, col) {
            this._setHighlight(row, col, false);
        },

        _setHighlight: function(row, col, value) {

            var group = this._cellGroups[this._cellId(row, col)];

            for (var i = 0; i < group.length; i++) {
                var r = group[i][0],
                    c = group[i][1];
                var cell = this._cells[this._cellId(r,c)];
                cell.removeClass('datepainter-highlight');
                if (value)
                    cell.addClass('datepainter-highlight');

            }
        },

        _isDateSelected: function(date) {
            return date.format('YYYY-MM-DD') in this.selected;
        },

        _selectDate: function(date) {
            this.selected[date.format('YYYY-MM-DD')] = true;
        },

        clearSelected: function() {
            this.selected = {}
            this._refresh();

        },

        _unselectDate: function(date) {
            delete this.selected[date.format('YYYY-MM-DD')];
        },

        _isCellGroupSelected: function(row, col) {


            var group = this._cellGroups[this._cellId(row, col)];

            var result = true;
            for (var i = 0; i < group.length; i++) {
                var r = group[i][0],
                    c = group[i][1],
                    date = this._getDate(r, c);

                if (this._isDateSelected(date) == false) {
                    result = false;
                    break;
                }
            }
            return result;

        },

        _toggleCellGroupSelection: function(row, col) {

            var group = this._cellGroups[this._cellId(row, col)];
            for (var i = 0; i < group.length; i++) {
                var r = group[i][0],
                    c = group[i][1],
                    date = this._getDate(r,c);
                if (this._mouseState == 'set') {
                    this._selectDate(this._getDate(r, c));
                } else if (this._mouseState == 'unset') {
                    this._unselectDate(this._getDate(r, c));
                }
                this._refreshCell(r,c);
            }

        },

        _onMouseDown: function(row, col) {

            var selected = this._isCellGroupSelected(row, col);
            if (selected == undefined)
                return;
            if (selected == false) {
                this._mouseState = 'set';
            } else {
                this._mouseState = 'unset';
            }
            this._onMouseEnter(row, col);


        },

        _onMouseUp: function() {
            this._mouseState = '';
        },

        selectedYear: function() {
            return this.yearSelect.val();

        },

        selectedMonth: function() {
            return this.monthSelect.val();
        },

        addMonths: function(m) {
            var date = moment().year(this.selectedYear()).month(this.selectedMonth()).add('months', m);

            if (date.year() >= this.firstYear && date.year() <= this.lastYear) {
                this.yearSelect.val(date.year());
                this.monthSelect.val(date.month());
                this._refresh();
            }


        },

        _refreshCell: function(row, col) {
            var today = moment();

            var text = "";
            var date = this._getDate(row, (col == 0) ? 1 : col);
            if (col == 0) {
                // show the week number in the first column
                text = date.format('w');
            } else {
                text = date.format('D');
            }
            var cell = this._cells[this._cellId(row, col)];
            cell.removeClass('datepainter-today datepainter-other-months datepainter-selected')

            if (date.year() == today.year()
                && date.month() == today.month()
                && date.date() == today.date())
                cell.addClass('datepainter-today');

            if (date.month() != this.selectedMonth() && col > 0)
                cell.addClass('datepainter-other-months');


            if (this._isDateSelected(date) && col > 0)
                cell.addClass('datepainter-selected');

            cell.text(text);
        },

        _isVisibleDate: function(date) {
            var firstDate = this._getDate(1, 1),
                lastDate = this._getDate(6,7);
            return (date.diff(firstDate,'days') >= 0 && date.diff(lastDate,'days') <= 0);

        },

        _refreshSelectedList: function() {
            var today = moment();
            var monthCounts = {};
            var monthNames = [];
            for (var key in this.selected) {
                var date = moment(key),
                    ym = date.format('YYYY-MM');
                if (this._isVisibleDate(date))
                    continue;
                if (!(ym in monthCounts)) {
                    monthCounts[ym] = 1;
                    monthNames.push(ym);
                } else
                    monthCounts[ym]++;
            }

            monthNames.sort();
            this.selectionList.children().remove();

            for (var i = 0; i < monthNames.length; i++) {
                var ym = monthNames[i],
                    date = moment(ym);


                this.selectionList.append($('<li>').text(date.format('MMM YYYY : ') + monthCounts[ym]));


            }
        },


        // called when created, and later when changing options
        _refresh: function() {


            for (var row = 1; row <= 6; row++) {
                for (var col = 0; col < 8; col++) {
                    this._refreshCell(row, col);

                }
            }
            this._refreshSelectedList();

        },

        // events bound via _on are removed automatically
        // revert other modifications here
        _destroy: function() {
            // remove generated elements
            this.calendar.remove();
            this.additionalList.remove();
            $(document).unbind('mouseup', this._onMouseUp)

        },

        // _setOptions is called with a hash of all options that are changing
        // always refresh when changing options
        _setOptions: function() {
            // _super and _superApply handle keeping the right this-context
            this._superApply( arguments );
            this._refresh();
        },

        // _setOption is called for each individual option that is changing
        _setOption: function( key, value ) {

            this._super( key, value );
        }
    });
})(jQuery);

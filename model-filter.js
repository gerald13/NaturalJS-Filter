define([
    'jquery',
    'underscore',
    'backbone',
    'backbone_forms',
    'requirejs-text!./Templates/tpl-filters.html',
    'requirejs-text!./Templates/tpl-CheckBoxes.html',

], function ($, _, Backbone, BbForms, tpl, tplcheck) {
    'use strict';
    return Backbone.View.extend({


        events: {
            "click input": 'clickedCheck'
        },
        ToggleFilter: null,
        filterContainer: null,
        channel: null,
        clientSide: null,
        name: null,
        com: null,
        url: null,
        datas: null,
        forms: [],
        filtersValues: null,
        /*=====================================
        =            Filter Module            =
        =====================================*/

        initialize: function (options) {
            this.filterContainer = options.filterContainer
            this.channel = options.channel;

            this.clientSide = options.clientSide;
            this.name = options.name || '';
            this.com = options.com;

            this.url = options.url;

            this.datas = {};

            this.url = options.url + 'getFilters';
            this.forms = [];
            if (options.filtersValues) {
                this.filtersValues = options.filtersValues;
            }
            // If filters are given we use them
            if (options.filters) {
                this.initFilters(options.filtersValues);
            }
            else {
                // Otherwise initialized from AJAX call
                this.getFilters();
            }
            this.ToggleFilter = options.ToggleFilter;
        },


        getFilters: function () {
            var _this = this;
            this.forms = [];
            var jqxhr = $.ajax({
                url: _this.url,
                data: {
                    FilterName: _this.name
                },
                contentType: 'application/json',
                type: 'GET',
                context: this,
            }).done(function (data) {
                this.initFilters(data);
                this.datas = data;
            }).fail(function (msg) {
                console.log(msg);
            });





        },

        initFilters: function (data) {
            var form;

            for (var key in data) {
                form = this.initFilter(data[key]);
                $('#' + this.filterContainer).append(form.el);

                if (data[key].type == 'Checkboxes') {
                    if (!this.filtersValues || !this.filtersValues[data[key].name]) {
                        $('#' + this.filterContainer).find("input[type='checkbox']").each(function () {
                            $(this).prop('checked', true);
                        });
                    }
                }
                $('#' + this.filterContainer + " input[type='checkbox']").on('click', this.clickedCheck);

                $('#' + this.filterContainer + ' #dateTimePicker').each(function () {
                    $(this).datetimepicker();
                });

                this.forms.push(form);
            };
            if (this.ToggleFilter) {
                for (var i = 0; i < this.forms.length; i++) {
                    
                    if (this.forms[i].model.get('Value') != null || this.forms[i].model.get('Value') == 0  ) {
                        if (
                            (this.forms[i].model.get('ColumnType') == 'Select' && this.forms[i].model.get('Value') == '-1')
                            || (this.forms[i].model.get('ColumnType') == 'Checkboxes' && this.forms[i].model.get('Value')[0] == '-1')
                            || (this.forms[i].model.get('Value') != '0' && this.forms[i].model.get('Value') == '')
                            ) {
                            // pas de saisie
                        }
                        else {
                            console.log('Filtre non vide :' + this.forms[i].model.get('Column'));
                            $('.filter-form-' + this.forms[i].model.get('Column') + ' .filter').addClass(this.ToggleFilter.classBefore);
                            var toggleInfo = {
                                columnName: this.forms[i].model.get('Column'),
                                classAfter: this.ToggleFilter.classAfter,
                                classBefore: this.ToggleFilter.classBefore,
                            }
                            setTimeout(function (toggleInfo) {
                                $('.filter-form-' + toggleInfo.columnName + ' .filter').removeClass(toggleInfo.classBefore);
                                $('.filter-form-' + toggleInfo.columnName + ' .filter').addClass(toggleInfo.classAfter);
                                //}
                            }, 0, toggleInfo);
                        }
                    }
                    
                }
                

            }
        },


        initFilter: function (dataRow) {
            var type = dataRow['type'];
            var fieldName = dataRow['name'];
            var template = tpl;
            dataRow['name'] = 'Value';
            var form;
            dataRow['editorClass'] = (dataRow['editorClass'] || '') + ' form-control filter';

            if (type == 'Select' || type == 'Checkboxes') {
                //
                if (type == 'Checkboxes') {
                    dataRow['options'].splice(0, 0, { label: 'All', val: -1, checked: true });
                    template = tplcheck;
                    dataRow['editorClass'] = dataRow['editorClass'].split('form-control').join('');
                    dataRow['editorClass'] += ' list-inline ';
                    // Adding name of field in class
                    //dataRow['editorClass'] += ' filter-' + fieldName;
                }
                else {
                    dataRow['options'].splice(0, 0, { label: ' ', val: -1 });
                }
            }

            var schm = {
                Column: { name: 'Column', type: 'Hidden', title: dataRow['label'], value: fieldName },
                ColumnType: { name: 'ColumnType', title: '', type: 'Hidden', value: type },
                Operator: {
                    type: 'Select', title: dataRow['label'], options: this.getOpOptions(type), editorClass: 'form-control ',//+ classe,
                },

                Value: dataRow
            }

            var valeur = null;
            var operatorValue = schm['Operator'].options[0].val;
            if (this.filtersValues && this.filtersValues[fieldName]) {
                valeur = this.filtersValues[fieldName].value;
                operatorValue = this.filtersValues[fieldName].operatorValue;
            }

            var md = Backbone.Model.extend({
                schema: schm,
                defaults: {
                    Column: fieldName,
                    ColumnType: type,
                    // For FireFox, select first option
                    Operator: operatorValue,
                    Value: valeur
                }
            });

            var mod = new md();
            mod.set('Value',valeur);
            form = new BbForms({
                template: _.template(template),
                model: mod,
                templateData: { filterName: dataRow['title'], ColumnType: type, fieldname: fieldName }
            }).render();

            //console.log(form.model);

            return form;
        },


        changeInput: function (options) {
        },




        clickedCheck: function (e) {
            // Keep the new check value
            var IsChecked = e.target.checked;
            if (e.target.value > 0) {
                //'Not checkall', We change the checkall if new target value is uncheked
                $(this).parent().parent().find('input:checkbox').each(function () {
                    if (this.value == -1 && !IsChecked) {
                        $(this).prop('checked', IsChecked);
                    }
                });
            }
            else {
                // CheckAll, all check input affected to checkAll Value
                //console.log('checkall');
                $(this).parent().parent().find('input:checkbox').each(function () {
                    $(this).prop('checked', IsChecked);
                });
            }

        },

        displayFilter: function () {

        },


        getOpOptions: function (type) {
            var operatorsOptions;
            switch (type) {
                case "Text": case "AutocompTreeEditor": case "AutocompleteEditor":
                    return operatorsOptions = [{ label: 'Equals', val: 'Is' }, { label: 'Does Not Equal', val: 'Is not' }, { label: 'Begins with', val: 'begins' }, { label: 'Does not Begin with', val: 'not begin' }, { label: 'Ends with', val: 'ends' }, { label: 'Does not end with', val: 'not end' }, { label: 'Contains', val: 'Contains' }, { label: 'Does not Contain', val: 'Not Contains' }, { label: 'In', val: 'IN' }, ];
                    break;
                case "DATETIME":
                    return operatorsOptions = [{ label: '<', val: '<' }, { label: '>', val: '>' }, { label: '=', val: '=' }, { label: '<>', val: '<>' }, { label: '<=', val: '<=' }, { label: '>=', val: '>=' }];
                    break;
                case "Select":
                    return operatorsOptions = [{ label: 'Is', val: 'Is' }, { label: 'Is not', val: 'Is not' }];
                    break;
                case "Checkboxes":
                    return operatorsOptions = [{ label: 'Checked', val: 'Checked' }];
                    break;
                    break;
                default:
                    return operatorsOptions = ['<', '>', '=', '<>', '<=', '>=', 'IN'];
                    break;
            }
        },

        update: function () {
            this.filters = [];
            var currentForm, value;
            for (var i = 0; i < this.forms.length; i++) {
                currentForm = this.forms[i];
                var Validation = currentForm.validate() ;
                //console.log('*********** Validation**********',Validation) ;
                if (!Validation && (!currentForm.getValue().Value == '0' && currentForm.getValue().Value != null) ) {
                    value = currentForm.getValue();
                    this.filters.push(value);
                    console.log('Add value ', value, this.filters);
                    currentForm.$el.find('input.filter').addClass('active');
                } else {
                    currentForm.$el.find('input.filter').removeClass('active')

                };
            };
            //console.log( this.filters);
            //console.log('fILTERS ***********************', this.filters);
            this.interaction('filter', this.filters)
            if (this.clientSide) {
                this.clientFilter(this.filters)
            }
        },




        reset: function () {
            $('#' + this.filterContainer).empty();
            this.filtersValues = null;
            if (this.clientSide) {
                this.initFilters(this.filters);
            }
            else {
                // Otherwise initialized from AJAX call
                this.getFilters();
            }
        },


        ///////////////////////// FILTRE CLIENT //////////////////////////////

        clientFilter: function (filters) {
            var tmp = this.com.getMotherColl();
            var mod = [];
            var filter;
            var col, op, val;
            var result = [];
            var ctx = this;


            var pass, rx, objVal;
            if (filters.length) {
                var coll = _.clone(tmp);
                _.filter(coll.models, function (obj) {
                    pass = true;

                    for (var i = filters.length - 1; i >= 0; i--) {
                        if (pass) {
                            filter = filters[i];
                            col = filter['Column'];
                            op = filter['Operator'];
                            val = filter['Value'];

                            objVal = obj.attributes[col];

                            //date
                            if (moment.isMoment(val)) {
                                pass = ctx.testDate(val, op, objVal);
                            } else {
                                pass = ctx.testMatch(val, op, objVal);
                            };
                        }
                    };
                    if (pass) {
                        mod.push(obj);
                    };
                });
                coll.reset(mod);
                this.com.action('filter', coll);
            } else {
                this.com.action('filter', tmp);
            }
        },


        testMatch: function (val, op, objVal) {
            var rx;
            switch (op.toLowerCase()) {
                case 'is':
                    val = val.toUpperCase();
                    rx = new RegExp('^' + val + '$');
                    if (!rx.test(objVal.toUpperCase())) {
                        return false;
                    };
                    break;
                case 'is not':
                    val = val.toUpperCase();
                    rx = new RegExp('^(^' + val + ')$'); //todo : not sure
                    if (!rx.test(objVal.toUpperCase())) {
                        return false;
                    };
                    break;
                case 'contains':
                    val = val.toUpperCase();
                    rx = new RegExp(val);
                    if (!rx.test(objVal.toUpperCase())) {
                        return false;
                    };
                    break;
                case '=':
                    if (!(objVal == val)) {
                        return false;
                    };
                    break;
                case '<>':
                    if (!(objVal != val)) {
                        return false;
                    };
                    break;
                case '>':
                    if (!(objVal > val)) {
                        return false;
                    };
                    break;
                case '<':
                    if (!(objVal < val)) {
                        return false;
                    };
                    break;
                case '>=':
                    if (!(objVal >= val)) {
                        return false;
                    };
                    break;
                case '<=':
                    if (!(objVal <= val)) {
                        return false;
                    };
                    break;
                default:
                    console.warn('wrong opperator');
                    return false;
                    break;
            };
            return true;
        },

        testDate: function (val, op, objVal) {
            var dateA = moment(val);
            var dateB = moment(objVal);

            switch (op.toLowerCase()) {
                case '=':
                    if (!(dateB.isSame(dateA))) {
                        return false;
                    };
                    break;
                case '!=':
                    if (dateB.isSame(dateA)) {
                        return false;
                    };
                    break;
                case '>':
                    if (!(dateA.isAfter(dateB))) {
                        return false;
                    };
                    break;
                case '<':
                    if (!(dateA.isBefore(dateB))) {
                        return false;
                    };
                    break;
                    //todo : verify those 2
                case '>=':
                    if (!(dateA.isAfter(dateB)) || !(dateB.isSame(dateA))) {
                        return false;
                    };
                    break;
                case '<=':
                    if (!(dateA.isBefore(dateB)) || !(dateB.isSame(dateA))) {
                        return false;
                    };
                    break;
                default:
                    console.log('wrong opperator');
                    return false;
                    break;

            };
            return true;

        },

        interaction: function (action, id) {
            if (this.com) {
                this.com.action(action, id);
            } else {
                this.action(action, id);
            }
        },

        action: function (action, params) {
            // Rien à faire
            return;
        },

    });
});

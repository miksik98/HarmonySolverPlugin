.import "../utils/Utils.js" as Utils
.import "../model/Chord.js" as Chord
.import "../harmonic/Exercise.js" as Exercise
.import "../commons/Errors.js" as Errors

var DEBUG = false

function ExerciseSolution(exercise, rating, chords, success) {
    this.exercise = exercise;
    this.rating = rating;
    this.chords = chords;

    this.success = success === undefined ? true : success //todo for later use
    this.infoMessages = []
    this.errorMessages = []

    if(!this.success && Utils.isDefined(exercise)){
        throw new Errors.SolverError("Cannot find solution for given harmonic functions",
            "If you want know more details please turn on prechecker in Settings and solve again")
    }

    this.setDurations = function () {
        function default_divide(number, result) {
            //default_divide(3, [1/2]) // [3]
            var newElement;
            if(result.length === number) return result
            var all_equal = true
            for (var i = 0; i < result.length - 1; i++) {
                if (result[i] > result[i + 1]) {
                    if (result[i] <= 1) {
                        result[i] /= 2
                        result.splice(i, 0, result[i])
                    } else {
                        newElement = Math.ceil(result[i] / 2)
                        result[i] = Math.floor(result[i] / 2)
                        result.splice(i, 0, newElement)
                    }
                    all_equal = false
                    break
                }
            }
            if (all_equal) {
                if (result[result.length - 1] <= 1) {
                    result[result.length - 1] /= 2
                    result.push(result[result.length - 1])
                } else {
                    newElement = Math.floor(result[result.length - 1] / 2)
                    result[result.length - 1] = Math.ceil(result[result.length - 1] / 2)
                    result.push(newElement)
                }
            }
            return default_divide(number, result)
        }

        function find_division_point(list) {
            var front = 0
            var back = list.length - 1
            var front_sum = list[front][0]
            var back_sum = list[back][0]
            var last = -1
            while (front < back) {
                if (front_sum > back_sum) {
                    back--
                    back_sum += list[back][0]
                    last = 0
                } else {
                    front++
                    front_sum += list[front][0]
                    last = 1
                }
            }
            return last === 0 ? back + 1 : front
        }

        function divide_fun_changed(measure) {
            var funList = []
            var changes_counter = 0
            if (measure.length === 1) return [[1, 0]]
            for (var i = 0; i < measure.length; i++) {
                var one_fun_counter = 0
                while (i < measure.length - 1 && measure[i].equals(measure[i + 1])) {
                    one_fun_counter++
                    i++
                }
                funList.push([one_fun_counter + 1, changes_counter])
                changes_counter++
            }
            return funList
        }

        function sum_of(list){
            var acc = 0;
            for (var i = 0; i < list.length; i++){
                acc += list[i][0];
            }
            return acc;
        }

        var measures = this.exercise.measures
        var offset = 0
        for (var measure_id = 0; measure_id < measures.length; measure_id++) {
            var current_measure = measures[measure_id]
            var funList = divide_fun_changed(current_measure)

            function add_time_to_fun(list, value) {
                if (list.length === 1) {
                    funList[list[0][1]].push(value)
                    return
                }
                var index = find_division_point(list)

                //little hack, should be handled in find_division_point
                if(index > 1 && Utils.mod(value, 2) === 0) index--

                var list1 = list.slice(0, index)
                var list2 = list.slice(index, list.length)
                if (value > 1) {
                    var ceil = Math.ceil(value / 2)
                    var floor = Math.floor(value / 2)
                    if (sum_of(list1) >= sum_of(list2)) {
                        add_time_to_fun(list1, ceil)
                        add_time_to_fun(list2, floor)
                    } else {
                        add_time_to_fun(list1, floor)
                        add_time_to_fun(list2, ceil)
                    }
                } else {
                    add_time_to_fun(list1, value / 2)
                    add_time_to_fun(list2, value / 2)
                }
            }

            add_time_to_fun(funList, this.exercise.meter[0])
            var counter_measure = 0
            var counter_fun = 0
            while (counter_measure < current_measure.length) {
                for (var i = 0; i < funList.length; i++) {
                    var len_list = default_divide(funList[i][0], [funList[i][2]])
                    for (var j = 0; j < len_list.length; j++) {
                        if (len_list[j] >= 1) {
                            this.chords[counter_measure + offset].duration = [len_list[j], this.exercise.meter[1]]
                        } else {
                            this.chords[counter_measure + offset].duration = [1, this.exercise.meter[1] * (1 / len_list[j])]
                        }
                        if(DEBUG) Utils.log("Duration added:", this.chords[counter_measure + offset].toString())
                        counter_measure++
                    }
                }
                counter_fun++
            }
            offset += current_measure.length
        }
    }

    this.addInfoMessage = function (message) {
        this.infoMessages.push(message)
    }

    this.addErrorMessage = function (message) {
        this.errorMessages.push(message)
    }

}

function exerciseSolutionReconstruct(sol){
    return new ExerciseSolution(
        Exercise.exerciseReconstruct(sol.exercise),
        sol.rating,
        sol.chords.map(function (chord) { return Chord.chordReconstruct(chord) }),
        sol.success
    )
}
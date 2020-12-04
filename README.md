# HarmonySolver
Rule-based system for solving functional harmony exercises

## Table of contents
* [Installation](#installation)
    * [Prerequisites](#prerequisites)
    * [Installation step by step](#installation-step-by-step)
* [How to use](#how-to-use)
    * [Exercises with given harmonic functions](#exercises-with-given-harmonic-functions)
    * [Exercises with given figured bass](#exercises-with-given-figured-bass)
    * [Exercises with given soprano melody](#exercises-with-given-soprano-melody)
    * [Plugin settings](#plugin-settings)
* [Inspirations](#inspirations)    
* [Team](#team)    

## Installation

#### Prerequisites

* MuseScore version at least 3.4 (plugin may not work with version 3.3.4 and lower)
* Windows (this plugin should also work with Linux systems, but it was not fully tested on Linux distributions)

#### Installation step by step
0. Download plugin - click Code -> Download ZIP. Use archive manager (WinRar, 7zip) to unpack it.<br/><br/>

1. Open MuseScore and go to Edit -> Preferences.<br/><br/>
![Alt text](./photos/1.png?raw=true "Title")

2. In tab "General" under "Folders" find path for "Plugins".<br/><br/>
![Alt text](./photos/2.png?raw=true "Title")

3. Copy whole unpacked "HarmonySolverPlugin-master" folder to this path.<br/><br/>
![Alt text](./photos/3.png?raw=true "Title")

4. Restart MuseScore and go to Plugins -> Plugin Manager.<br/><br/>
![Alt text](./photos/4.png?raw=true "Title")

5. "harmonySolver" should appear on the left. Tick checkbox next to it and press ok. If harmonySolver is not visible, press "Reload Plugins" button.
You can also set here keyboard shortcut for harmonySolver (Define Shortcut).<br/><br/>
![Alt text](./photos/5.png?raw=true "Title")

6. After that, you can use harmonySolver plugin by clicking Plugins -> HarmonySolver or using defined shortcut.<br/><br/>
![Alt text](./photos/6.png?raw=true "Title")

## How to use
Plugin solves three types of exercises connected with functional harmony:
* exercises with given harmonic functions
* exercises with given figured bass
* exercises with given soprano melody

It generates four-part harmonization satisfying given input according to
functional harmony rules.

### Exercises with given harmonic functions
To solve this type of exercises open a tab called "Harmonics".

You can use three buttons: 
* *Import* - for import saved file with exercise
* *Check Input* - for checking of input correctness 
* *Solve* - for solving given exercise

There will also appear a place to provide harmonic functions input.<br/>
You should use dedicated notation:

**First line** must contain key. It should be lower letter for minor keys, and upper letter for major keys.
You can also append accidentals. Examples:
* *C (= C major)*
* *e (= e minor)*
* *Db*
* *ab*
* *G#*
* *f#* 

**Second line** must contain metre. It should be provided in format: "nominator / denominator". For example:
* *3 / 4*
* *12 / 8*
* *2 / 2*

**Each next line** is treated as next measure.
Each measure contains harmonic functions separated by a semicolon.
Harmonic function must satisfy the scheme: <br/>**X{ extra arguments }**, where 
X is one of **T** (major tonic), **S** (major subdominant) or **D** (major dominant).
<br/>You can also use minor harmonic functions: **To** (minor tonic), **So** (minor subdominant),
**Do** (minor dominant).

You can provide also extra arguments for harmonic function. Every argument
should be inside curly parentheses and be separated from next by slash.
What is more every extra argument should satisfy the schema: **key : value**. <br/>
List of extra arguments:
* **position** - determines which chord component should soprano note be.
<br/>Example usage: "*position: 3>*" means that soprano should be minor third of given harmonic function.
* **revolution** - determines which chord component should bass note be.
If not specified in bass will be prime of chord.
<br/>Example usage: "*revolution: 5*" means that bass should be fifth of given harmonic function.
* **system** - determines if system of result chord should be open or close.
<br/>Example usage: "*system: open*" and "*system: close*".
* **degree** - determines degree of harmonic function. Using this argument you can 
satisfy for example T<sub>III</sub> or D<sub>VII</sub>.
<br/>Example usage: "*degree: 3*" or "*degree: 6*".
* **extra** - determines extra chord components to use. For example, you can
satisfy subdominant with extra sixth or dominant with extra seven.
<br/>Example usage: "*extra: 6*" means extra sixth for harmonic function, 
"*extra: 7, 9>*" means extra seventh and minor ninth fo harmonic function.
* **omit** - determines which chord components to omit.
<br/>Example usage: "*omit: 5*" means that fifth will be omitted in that chord 
and all voices will not contain fifth.
* **delay** - determines if chord components should be delayed by other chord components.
Plugin supports only single delays x - y, where interval between x and y is not bigger
than second. Plugin also supports delays like 7 - 8 or 9 - 8.
<br/>Example usage: "*delay: 4-3*" means that third should be delayed by fourth, 
"*delay: 6-5, 4-3*" means that fifth should be delayed by sixth and third by fourth.
* **down** - if used, harmonic function is down.
<br/>Example usage: "*down*".
* **isRelatedBackwards** - if used, harmonic function is related backwards.
It should be used for deflections.
<br/>Example usage: "*isRelatedBackwards*".

Full examples of harmonic functions:
* `D{extra: 7 / delay: 6-5, 4-3 / position: 7 / revolution: 1}` - means
dominant with extra 7 in soprano voice, in bass should be 1, 
also specified special delays.
* `So{down / revolution: 3>}` - means minor subdominant, down, with 3> in bass
(= Neapolitan chord).
* `D{extra: 9 / omit: 5}` - means dominant with extra 9 without usage of 5. 

Full example of measure: 
<br/>`T{}; S{}; So{extra:6}; D{extra: 7, omit: 5}; T{delay: 4-3}`

Plugin supports **modulation deflections**. To specify deflection you have to wrap harmonic functions between parentheses.
Examples: 
* `(S{}; D{}); D{}; T{}` - means that we have modulation deflection to dominant.
* `(S{}; D{})[T{degree:6}];D{};T{}` - the first part is the elipse. Between parentheses () there is deflection to elipse source chord
which should be wrapped between [].
* `S{}; (S{isRelatedBackwards}); D{}; T{}` - means that second harmonic function is deflected backwards to first harmonic function.

Plugin supports Chopin chord and Neapolitan chord.
When you specify harmonic function with more than four chord components,
plugin will choose the ones to omit.
When you add ninth to extra, plugin adds seventh to extra.
It also corrects mistakes made by user - for example from T{position: 3>} it will make T{position: 3}.

Plugin supports fifth alterations. 
<br/>For example `D{extra: 7,5<}` will generate seventh dominant with upper altered fifth.  

There are also some example files in folder /examples/harmonics.
You can import them and learn notation from examples.

### Exercises with given figured bass
To solve this type of exercises open a tab called "Bass".

There is only one button *Solve* for solving exercise.
Before you will click *Solve*, you should open score containing 
bass voice with figured bass symbols. If you want to bind note with
a specific symbol - choose note from score and use shortcut *ctrl+G*.
Remember not to use rests, ties and more than single delays, plugin does not support them.

All alteration in bass symbols should be after the number and should be represented as *b*, *#* and *h*, not "<" or ">".

You can delay up to two numbers, for example "6b-5, 4-3". You cannot have delay like "6-".

Whole score should have one metre and should not have an anacrusis.

All alteration symbols without number will be applied to 3.

Here is a table with all supported number bass symbols with their translations (you can also use other symbols and combinations, but they may not be handled correctly):

| Input symbols | How they will be treated |
|:-------------:|:-------------:|
| (nothing)        | 5 <br> 3        |
| 5                | 5 <br> 3        |
| 3                | 5 <br> 3        |
| 5 <br> 3         | 5 <br> 3        |
| 6                | 6 <br> 3        |
| 6 <br> 3         | 6 <br> 3        |
| 7                | 7 <br> 5 <br> 3        |
| 7 <br> 5         | 7 <br> 5 <br> 3        |
| 7 <br> 3         | 7 <br> 5 <br> 3        |
| 7 <br> 5 <br> 3  | 7 <br> 5 <br> 3        |
| 2                | 6 <br> 4 <br> 2        |
| 4<br>2           | 6 <br> 4 <br> 2        |
| 6 <br> 4 <br> 2  | 6 <br> 4 <br> 2        |
| 4<br>3           | 6 <br> 4 <br> 3        |
| 6 <br> 4 <br> 3  | 6 <br> 4 <br> 3        |
| 6 <br> 4         | 6 <br> 4        |
| 6 <br> 5         | 6 <br> 5 <br> 3        |
| 6 <br> 5 <br> 3  | 6 <br> 5 <br> 3        |
| 10 <br> 2        | 10 <br> 4 <br> 2       |
| 10 <br> 4 <br> 2 | 10 <br> 4 <br> 2         |
| 9 <br> 7         | 9 <br> 7 <br> 5 <br> 3        |
| 9 <br> 7 <br> 3  | 9 <br> 7 <br> 5 <br> 3        |
| 9<br>7<br>5<br>3 | 9 <br> 7 <br> 5 <br> 3        |
| 7 <br> 5 <br> 6  | 7 <br> 5 <br> 6        |


There are also some example scores in folder /examples/bass.

### Exercises with given soprano melody
To solve this type of exercises open a tab called "Soprano".

At the top side you can choose the set of chords used to harmonization.
Tonic, subdominant and dominant are obligatory. Remember to choose right scale.
Default scale is major.

At the bottom side you can set tolerance for breaking basic functional harmony's rules.
If 0% is set than rule cannot be broken. The greater percentage, the more
likely rule is broken.

List of basic rules:
* **Parallel fifths** - interval of fifth between two same voices in two next chords
* **Parallel octaves** - interval of octave between two same voices in two next chords
* **Crossing voices** - intersection of melodic lines in two neighbour voices
* **One direction** - all voices goes in same direction from one chord to next chord
* **Hidden octaves** - unsounded musical interval of an octave that is implied by the similar up or down motion of two voice parts and that if sounded would produce parallel octaves
* **False relation** - chromatic move not in the same voice
* **Repeated function** - two identical chords with same harmonic function
* **Illegal doubled third** - third treated as chord component occurs in at least two voices when it is not allowed

Before you will click *Solve*, you should open a score with only soprano voice.
Remember not to use rests. Whole score should have one metre and should not have an anacrusis.

Each note of melody will be harmonized. The number of chords will be equal to number of notes.

There are also some example scores in folder /examples/soprano.

### Plugin settings
You can choose path for solution scores. The default path is /main/solutions.

You can enable printing chord components and chord symbols in solution score.
What is more plugin has two special components: *prechecker* and *corrector*. 
You can also enable or disable them.

**prechecker** - evaluates rules for all pairs of neighbour harmonic functions.
Also it checks if harmonic function could generate at least one chord. If no, 
it will let you know about this problem. It does not work in soprano harmonization.

**corrector** - makes some basic corrections with given harmonic functions:
* for chain dominants (for example (D7) -> D7 -> T) chooses harmonic functions
where fifth should be omitted (if not specified) to avoid parallel fifths
* for connections like D7 (where 7 is in bass) -> T it sets revolution of T to third
(if not specified)
* for Chopin chord adds fifth to omit (if not specified)

Using prechecker and corrector is recommended for beginners.

Plugin settings are persistent and if you exit plugin and launch it again they 
will load exactly like you set before turning plugin off.

## Inspirations
The business logic of plugin is based on the content of the books:
* "Podstawy harmonii funkcyjnej" by Jacek Targosz, PWM 2004
* "Harmonia - zbiór zadań i przykładów do I i II części podręcznika dla 
średnich szkół muzycznych" by Kazimierz Sikorski, PWM 1984

## Team
The project was carried out as an engineering thesis in computer science
at AGH University of Technology, Cracow 2020.

Developers:
* Wiktor Pawłowski
* Mikołaj Sikora
* Jakub Sroka 

Supervisor:
* PhD Maciej Smołka (Assistant Professor)

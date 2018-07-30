# Internal references
* var.value vs @var.value
* @value vs self.value

# Coordinate system
* Should the origin be at the top left or center? I think center is a better
fit, because component definition and composition is an important part of
using ANML, and I believe modeling programs usually use (0,0). It makes things
like rotation a lot easier. Plus I think it will make more sense for
beginners who have some math background but no CG experience.

# name
* Should all elements have a mandatory indentifier, or just keep using the
name attribute? Should names be forced unique? If so, what about scoping?

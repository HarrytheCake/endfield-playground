## Version: 2026/06/08

## Target
Find all pairs of overlapping objects

---

## Primitive: overlap check

### Define "overlap"
Two objects overlap iff their projections intersect on **all** dimensions.
```
function bool overlap(obj1, obj2)
{
    d from 0 to dim-1:
    {
        if (obj1.position[d][1] <= obj2.position[d][0] || obj2.position[d][1] <= obj1.position[d][0])
        {
            return false;   // separated on this axis → no overlap
        }
    }
    return true;    // not separated on any axis → overlap
}
```
Execute $dim$ times per pair.

---

## Algorithm: Chunk-based broad phase

### Notation
| Symbol | Meaning |
|---|---|
| $dim$ | dimension |
| $M$ | map size (per axis) |
| $N$ | number of objects |
| $s$ | avg object size (per axis) |
| $C$ | chunk size (per axis) |

In this case, $dim$ may be taken as $2$ since $z$-axis is relatively thin.

```
class object 
{
    id: string or int,
    position: [x_{1},...,x_{dim}][min,max]
    // dim x 2 array
}
```

---

### Step 1 — Distribute objects into chunks

```
n from 0 to N-1:
{
    d from 0 to dim-1:
    {
        cmin_{d} = floor(object[n].position[d][0] / C);
        cmax_{d} = floor(object[n].position[d][1] / C);
        // 0 <= cmax_{d} - cmin_{d} <= 1 if ( C > s )
    }
    // objects may cross chunks sometimes

    c_{1} from cmin_{1} to cmax_{1}:
    {
        ...
        c_{dim} from cmin_{dim} to cmax_{dim}:
        {
            chunk[c_{1}]...[c_{dim}].append(object[n]);
        }
    }
}
```

For each dimension, chunks that object overlap with = $1+\frac{s}{C}$
So, we have to execute $N(2 dim + (\frac{C+s}{C})^{dim})$

### Step 2 — Check every pair in every chunk

```
for each chunk:
{
    for each (A,B) with (A<B):
    {
        if(overlap(A,B) === true):
        {
            overlap_list.append([A,B])
        }
    }
}
```

We have $(\frac{M}{C})^{dim}$ chunks and "count" $N(\frac{C+s}{C})^{dim}$ times.
Thus, each chunk has $N(\frac{C+s}{M})^{dim}$ objects 
and then requires running $\frac{1}{2}(N(\frac{C+s}{M})^{dim})^{2}$ times `overlap()`

Finally, we have to execute
$$ N(2dim + (\frac{C+s}{C})^{dim} + \frac{dim \cdot N}{2}(\frac{(C+s)^{2}}{C\cdot M})^{dim}) $$
times
This function of $C$ attains extreme value when 
$$(C+s)^{dim}(C-s) = \frac{2s \cdot M^{dim}}{dim \cdot N}$$
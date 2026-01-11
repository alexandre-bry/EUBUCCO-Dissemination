import "./chunk-BUSYA2B4.js";

// website/node_modules/fflate/esm/browser.js
var ch2 = {};
var wk = (function(c, id, msg, transfer, cb) {
  var w2 = new Worker(ch2[id] || (ch2[id] = URL.createObjectURL(new Blob([
    c + ';addEventListener("error",function(e){e=e.error;postMessage({$e$:[e.message,e.code,e.stack]})})'
  ], { type: "text/javascript" }))));
  w2.onmessage = function(e) {
    var d = e.data, ed = d.$e$;
    if (ed) {
      var err2 = new Error(ed[0]);
      err2["code"] = ed[1];
      err2.stack = ed[2];
      cb(err2, null);
    } else
      cb(null, d);
  };
  w2.postMessage(msg, transfer);
  return w2;
});
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b3 = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b3[i] = start += 1 << eb[i - 1];
  }
  var r = new i32(b3[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j2 = b3[i]; j2 < b3[i + 1]; ++j2) {
      r[j2] = j2 - b3[i] << 5 | i;
    }
  }
  return { b: b3, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x2 = (i & 43690) >> 1 | (i & 21845) << 1;
  x2 = (x2 & 52428) >> 2 | (x2 & 13107) << 2;
  x2 = (x2 & 61680) >> 4 | (x2 & 3855) << 4;
  rev[i] = ((x2 & 65280) >> 8 | (x2 & 255) << 8) >> 1;
}
var x2;
var i;
var hMap = (function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l2 = new u16(mb);
  for (; i < s; ++i) {
    if (cd[i])
      ++l2[cd[i] - 1];
  }
  var le = new u16(mb);
  for (i = 1; i < mb; ++i) {
    le[i] = le[i - 1] + l2[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v2 = le[cd[i] - 1]++ << r_1;
        for (var m2 = v2 | (1 << r_1) - 1; v2 <= m2; ++v2) {
          co[rev[v2] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
      }
    }
  }
  return co;
});
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flm = hMap(flt, 9, 0);
var flrm = hMap(flt, 9, 1);
var fdm = hMap(fdt, 5, 0);
var fdrm = hMap(fdt, 5, 1);
var max = function(a) {
  var m2 = a[0];
  for (var i = 1; i < a.length; ++i) {
    if (a[i] > m2)
      m2 = a[i];
  }
  return m2;
};
var bits = function(d, p, m2) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8) >> (p & 7) & m2;
};
var bits16 = function(d, p) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
};
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v2, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v2.length)
    e = v2.length;
  return new u8(v2.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var inflt = function(dat, st, buf, dict) {
  var sl = dat.length, dl = dict ? dict.length : 0;
  if (!sl || st.f && !st.l)
    return buf || new u8(0);
  var noBuf = !buf;
  var resize = noBuf || st.i != 2;
  var noSt = st.i;
  if (noBuf)
    buf = new u8(sl * 3);
  var cbuf = function(l3) {
    var bl = buf.length;
    if (l3 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l3));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        var s = shft(pos) + 4, l2 = dat[s - 4] | dat[s - 3] << 8, t = s + l2;
        if (t > sl) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + l2);
        buf.set(dat.subarray(s, t), bt);
        st.b = bt += l2, st.p = pos = t * 8, st.f = final;
        continue;
      } else if (type == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type == 2) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i = 0; i < hcLen; ++i) {
          clt[clim[i]] = bits(dat, pos + i * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i = 0; i < tl; ) {
          var r = clm[bits(dat, pos, clbmsk)];
          pos += r & 15;
          var s = r >> 4;
          if (s < 16) {
            ldt[i++] = s;
          } else {
            var c = 0, n = 0;
            if (s == 16)
              n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
            else if (s == 17)
              n = 3 + bits(dat, pos, 7), pos += 3;
            else if (s == 18)
              n = 11 + bits(dat, pos, 127), pos += 7;
            while (n--)
              ldt[i++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        err(1);
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
    }
    if (resize)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos;
    for (; ; lpos = pos) {
      var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
      if (!c)
        err(2);
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos, lm = null;
        break;
      } else {
        var add = sym - 254;
        if (sym > 264) {
          var i = sym - 257, b3 = fleb[i];
          add = bits(dat, pos, (1 << b3) - 1) + fl[i];
          pos += b3;
        }
        var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
        if (!d)
          err(3);
        pos += d & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b3 = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b3) - 1, pos += b3;
        }
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + 131072);
        var end = bt + add;
        if (bt < dt) {
          var shift = dl - dt, dend = Math.min(dt, end);
          if (shift + bt < 0)
            err(3);
          for (; bt < dend; ++bt)
            buf[bt] = dict[shift + bt];
        }
        for (; bt < end; ++bt)
          buf[bt] = buf[bt - dt];
      }
    }
    st.l = lm, st.p = lpos, st.b = bt, st.f = final;
    if (lm)
      final = 1, st.m = lbt, st.d = dm, st.n = dbt;
  } while (!final);
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
var wbits = function(d, p, v2) {
  v2 <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v2;
  d[o + 1] |= v2 >> 8;
};
var wbits16 = function(d, p, v2) {
  v2 <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v2;
  d[o + 1] |= v2 >> 8;
  d[o + 2] |= v2 >> 16;
};
var hTree = function(d, mb) {
  var t = [];
  for (var i = 0; i < d.length; ++i) {
    if (d[i])
      t.push({ s: i, f: d[i] });
  }
  var s = t.length;
  var t2 = t.slice();
  if (!s)
    return { t: et, l: 0 };
  if (s == 1) {
    var v2 = new u8(t[0].s + 1);
    v2[t[0].s] = 1;
    return { t: v2, l: 1 };
  }
  t.sort(function(a, b3) {
    return a.f - b3.f;
  });
  t.push({ s: -1, f: 25001 });
  var l2 = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
  t[0] = { s: -1, f: l2.f + r.f, l: l2, r };
  while (i1 != s - 1) {
    l2 = t[t[i0].f < t[i2].f ? i0++ : i2++];
    r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
    t[i1++] = { s: -1, f: l2.f + r.f, l: l2, r };
  }
  var maxSym = t2[0].s;
  for (var i = 1; i < s; ++i) {
    if (t2[i].s > maxSym)
      maxSym = t2[i].s;
  }
  var tr = new u16(maxSym + 1);
  var mbt = ln(t[i1 - 1], tr, 0);
  if (mbt > mb) {
    var i = 0, dt = 0;
    var lft = mbt - mb, cst = 1 << lft;
    t2.sort(function(a, b3) {
      return tr[b3.s] - tr[a.s] || a.f - b3.f;
    });
    for (; i < s; ++i) {
      var i2_1 = t2[i].s;
      if (tr[i2_1] > mb) {
        dt += cst - (1 << mbt - tr[i2_1]);
        tr[i2_1] = mb;
      } else
        break;
    }
    dt >>= lft;
    while (dt > 0) {
      var i2_2 = t2[i].s;
      if (tr[i2_2] < mb)
        dt -= 1 << mb - tr[i2_2]++ - 1;
      else
        ++i;
    }
    for (; i >= 0 && dt; --i) {
      var i2_3 = t2[i].s;
      if (tr[i2_3] == mb) {
        --tr[i2_3];
        ++dt;
      }
    }
    mbt = mb;
  }
  return { t: new u8(tr), l: mbt };
};
var ln = function(n, l2, d) {
  return n.s == -1 ? Math.max(ln(n.l, l2, d + 1), ln(n.r, l2, d + 1)) : l2[n.s] = d;
};
var lc = function(c) {
  var s = c.length;
  while (s && !c[--s])
    ;
  var cl = new u16(++s);
  var cli = 0, cln = c[0], cls = 1;
  var w2 = function(v2) {
    cl[cli++] = v2;
  };
  for (var i = 1; i <= s; ++i) {
    if (c[i] == cln && i != s)
      ++cls;
    else {
      if (!cln && cls > 2) {
        for (; cls > 138; cls -= 138)
          w2(32754);
        if (cls > 2) {
          w2(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
          cls = 0;
        }
      } else if (cls > 3) {
        w2(cln), --cls;
        for (; cls > 6; cls -= 6)
          w2(8304);
        if (cls > 2)
          w2(cls - 3 << 5 | 8208), cls = 0;
      }
      while (cls--)
        w2(cln);
      cls = 1;
      cln = c[i];
    }
  }
  return { c: cl.subarray(0, cli), n: s };
};
var clen = function(cf, cl) {
  var l2 = 0;
  for (var i = 0; i < cl.length; ++i)
    l2 += cf[i] * cl[i];
  return l2;
};
var wfblk = function(out, pos, dat) {
  var s = dat.length;
  var o = shft(pos + 2);
  out[o] = s & 255;
  out[o + 1] = s >> 8;
  out[o + 2] = out[o] ^ 255;
  out[o + 3] = out[o + 1] ^ 255;
  for (var i = 0; i < s; ++i)
    out[o + i + 4] = dat[i];
  return (o + 4 + s) * 8;
};
var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
  wbits(out, p++, final);
  ++lf[256];
  var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
  var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
  var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
  var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
  var lcfreq = new u16(19);
  for (var i = 0; i < lclt.length; ++i)
    ++lcfreq[lclt[i] & 31];
  for (var i = 0; i < lcdt.length; ++i)
    ++lcfreq[lcdt[i] & 31];
  var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
  var nlcc = 19;
  for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
    ;
  var flen = bl + 5 << 3;
  var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
  var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
  if (bs >= 0 && flen <= ftlen && flen <= dtlen)
    return wfblk(out, p, dat.subarray(bs, bs + bl));
  var lm, ll, dm, dl;
  wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
  if (dtlen < ftlen) {
    lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
    var llm = hMap(lct, mlcb, 0);
    wbits(out, p, nlc - 257);
    wbits(out, p + 5, ndc - 1);
    wbits(out, p + 10, nlcc - 4);
    p += 14;
    for (var i = 0; i < nlcc; ++i)
      wbits(out, p + 3 * i, lct[clim[i]]);
    p += 3 * nlcc;
    var lcts = [lclt, lcdt];
    for (var it = 0; it < 2; ++it) {
      var clct = lcts[it];
      for (var i = 0; i < clct.length; ++i) {
        var len = clct[i] & 31;
        wbits(out, p, llm[len]), p += lct[len];
        if (len > 15)
          wbits(out, p, clct[i] >> 5 & 127), p += clct[i] >> 12;
      }
    }
  } else {
    lm = flm, ll = flt, dm = fdm, dl = fdt;
  }
  for (var i = 0; i < li; ++i) {
    var sym = syms[i];
    if (sym > 255) {
      var len = sym >> 18 & 31;
      wbits16(out, p, lm[len + 257]), p += ll[len + 257];
      if (len > 7)
        wbits(out, p, sym >> 23 & 31), p += fleb[len];
      var dst = sym & 31;
      wbits16(out, p, dm[dst]), p += dl[dst];
      if (dst > 3)
        wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
    } else {
      wbits16(out, p, lm[sym]), p += ll[sym];
    }
  }
  wbits16(out, p, lm[256]);
  return p + ll[256];
};
var deo = new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
var et = new u8(0);
var dflt = function(dat, lvl, plvl, pre, post, st) {
  var s = st.z || dat.length;
  var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
  var w2 = o.subarray(pre, o.length - post);
  var lst = st.l;
  var pos = (st.r || 0) & 7;
  if (lvl) {
    if (pos)
      w2[0] = st.r >> 3;
    var opt = deo[lvl - 1];
    var n = opt >> 13, c = opt & 8191;
    var msk_1 = (1 << plvl) - 1;
    var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
    var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
    var hsh = function(i2) {
      return (dat[i2] ^ dat[i2 + 1] << bs1_1 ^ dat[i2 + 2] << bs2_1) & msk_1;
    };
    var syms = new i32(25e3);
    var lf = new u16(288), df = new u16(32);
    var lc_1 = 0, eb = 0, i = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
    for (; i + 2 < s; ++i) {
      var hv = hsh(i);
      var imod = i & 32767, pimod = head[hv];
      prev[imod] = pimod;
      head[hv] = imod;
      if (wi <= i) {
        var rem = s - i;
        if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
          pos = wblk(dat, w2, 0, syms, lf, df, eb, li, bs, i - bs, pos);
          li = lc_1 = eb = 0, bs = i;
          for (var j2 = 0; j2 < 286; ++j2)
            lf[j2] = 0;
          for (var j2 = 0; j2 < 30; ++j2)
            df[j2] = 0;
        }
        var l2 = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
        if (rem > 2 && hv == hsh(i - dif)) {
          var maxn = Math.min(n, rem) - 1;
          var maxd = Math.min(32767, i);
          var ml = Math.min(258, rem);
          while (dif <= maxd && --ch_1 && imod != pimod) {
            if (dat[i + l2] == dat[i + l2 - dif]) {
              var nl = 0;
              for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl)
                ;
              if (nl > l2) {
                l2 = nl, d = dif;
                if (nl > maxn)
                  break;
                var mmd = Math.min(dif, nl - 2);
                var md = 0;
                for (var j2 = 0; j2 < mmd; ++j2) {
                  var ti = i - dif + j2 & 32767;
                  var pti = prev[ti];
                  var cd = ti - pti & 32767;
                  if (cd > md)
                    md = cd, pimod = ti;
                }
              }
            }
            imod = pimod, pimod = prev[imod];
            dif += imod - pimod & 32767;
          }
        }
        if (d) {
          syms[li++] = 268435456 | revfl[l2] << 18 | revfd[d];
          var lin = revfl[l2] & 31, din = revfd[d] & 31;
          eb += fleb[lin] + fdeb[din];
          ++lf[257 + lin];
          ++df[din];
          wi = i + l2;
          ++lc_1;
        } else {
          syms[li++] = dat[i];
          ++lf[dat[i]];
        }
      }
    }
    for (i = Math.max(i, wi); i < s; ++i) {
      syms[li++] = dat[i];
      ++lf[dat[i]];
    }
    pos = wblk(dat, w2, lst, syms, lf, df, eb, li, bs, i - bs, pos);
    if (!lst) {
      st.r = pos & 7 | w2[pos / 8 | 0] << 3;
      pos -= 7;
      st.h = head, st.p = prev, st.i = i, st.w = wi;
    }
  } else {
    for (var i = st.w || 0; i < s + lst; i += 65535) {
      var e = i + 65535;
      if (e >= s) {
        w2[pos / 8 | 0] = lst;
        e = s;
      }
      pos = wfblk(w2, pos + 1, dat.subarray(i, e));
    }
    st.i = s;
  }
  return slc(o, 0, pre + shft(pos) + post);
};
var crct = (function() {
  var t = new Int32Array(256);
  for (var i = 0; i < 256; ++i) {
    var c = i, k2 = 9;
    while (--k2)
      c = (c & 1 && -306674912) ^ c >>> 1;
    t[i] = c;
  }
  return t;
})();
var crc = function() {
  var c = -1;
  return {
    p: function(d) {
      var cr = c;
      for (var i = 0; i < d.length; ++i)
        cr = crct[cr & 255 ^ d[i]] ^ cr >>> 8;
      c = cr;
    },
    d: function() {
      return ~c;
    }
  };
};
var adler = function() {
  var a = 1, b3 = 0;
  return {
    p: function(d) {
      var n = a, m2 = b3;
      var l2 = d.length | 0;
      for (var i = 0; i != l2; ) {
        var e = Math.min(i + 2655, l2);
        for (; i < e; ++i)
          m2 += n += d[i];
        n = (n & 65535) + 15 * (n >> 16), m2 = (m2 & 65535) + 15 * (m2 >> 16);
      }
      a = n, b3 = m2;
    },
    d: function() {
      a %= 65521, b3 %= 65521;
      return (a & 255) << 24 | (a & 65280) << 8 | (b3 & 255) << 8 | b3 >> 8;
    }
  };
};
var dopt = function(dat, opt, pre, post, st) {
  if (!st) {
    st = { l: 1 };
    if (opt.dictionary) {
      var dict = opt.dictionary.subarray(-32768);
      var newDat = new u8(dict.length + dat.length);
      newDat.set(dict);
      newDat.set(dat, dict.length);
      dat = newDat;
      st.w = dict.length;
    }
  }
  return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
};
var mrg = function(a, b3) {
  var o = {};
  for (var k2 in a)
    o[k2] = a[k2];
  for (var k2 in b3)
    o[k2] = b3[k2];
  return o;
};
var wcln = function(fn, fnStr, td2) {
  var dt = fn();
  var st = fn.toString();
  var ks = st.slice(st.indexOf("[") + 1, st.lastIndexOf("]")).replace(/\s+/g, "").split(",");
  for (var i = 0; i < dt.length; ++i) {
    var v2 = dt[i], k2 = ks[i];
    if (typeof v2 == "function") {
      fnStr += ";" + k2 + "=";
      var st_1 = v2.toString();
      if (v2.prototype) {
        if (st_1.indexOf("[native code]") != -1) {
          var spInd = st_1.indexOf(" ", 8) + 1;
          fnStr += st_1.slice(spInd, st_1.indexOf("(", spInd));
        } else {
          fnStr += st_1;
          for (var t in v2.prototype)
            fnStr += ";" + k2 + ".prototype." + t + "=" + v2.prototype[t].toString();
        }
      } else
        fnStr += st_1;
    } else
      td2[k2] = v2;
  }
  return fnStr;
};
var ch = [];
var cbfs = function(v2) {
  var tl = [];
  for (var k2 in v2) {
    if (v2[k2].buffer) {
      tl.push((v2[k2] = new v2[k2].constructor(v2[k2])).buffer);
    }
  }
  return tl;
};
var wrkr = function(fns, init, id, cb) {
  if (!ch[id]) {
    var fnStr = "", td_1 = {}, m2 = fns.length - 1;
    for (var i = 0; i < m2; ++i)
      fnStr = wcln(fns[i], fnStr, td_1);
    ch[id] = { c: wcln(fns[m2], fnStr, td_1), e: td_1 };
  }
  var td2 = mrg({}, ch[id].e);
  return wk(ch[id].c + ";onmessage=function(e){for(var k in e.data)self[k]=e.data[k];onmessage=" + init.toString() + "}", id, td2, cbfs(td2), cb);
};
var bInflt = function() {
  return [u8, u16, i32, fleb, fdeb, clim, fl, fd, flrm, fdrm, rev, ec, hMap, max, bits, bits16, shft, slc, err, inflt, inflateSync, pbf, gopt];
};
var bDflt = function() {
  return [u8, u16, i32, fleb, fdeb, clim, revfl, revfd, flm, flt, fdm, fdt, rev, deo, et, hMap, wbits, wbits16, hTree, ln, lc, clen, wfblk, wblk, shft, slc, dflt, dopt, deflateSync, pbf];
};
var guze = function() {
  return [gzs, gzl];
};
var zule = function() {
  return [zls];
};
var pbf = function(msg) {
  return postMessage(msg, [msg.buffer]);
};
var gopt = function(o) {
  return o && {
    out: o.size && new u8(o.size),
    dictionary: o.dictionary
  };
};
var astrm = function(strm) {
  strm.ondata = function(dat, final) {
    return postMessage([dat, final], [dat.buffer]);
  };
  return function(ev) {
    if (ev.data.length) {
      strm.push(ev.data[0], ev.data[1]);
      postMessage([ev.data[0].length]);
    } else
      strm.flush();
  };
};
var astrmify = function(fns, strm, opts, init, id, flush, ext) {
  var t;
  var w2 = wrkr(fns, init, id, function(err2, dat) {
    if (err2)
      w2.terminate(), strm.ondata.call(strm, err2);
    else if (!Array.isArray(dat))
      ext(dat);
    else if (dat.length == 1) {
      strm.queuedSize -= dat[0];
      if (strm.ondrain)
        strm.ondrain(dat[0]);
    } else {
      if (dat[1])
        w2.terminate();
      strm.ondata.call(strm, err2, dat[0], dat[1]);
    }
  });
  w2.postMessage(opts);
  strm.queuedSize = 0;
  strm.push = function(d, f) {
    if (!strm.ondata)
      err(5);
    if (t)
      strm.ondata(err(4, 0, 1), null, !!f);
    strm.queuedSize += d.length;
    w2.postMessage([d, t = f], [d.buffer]);
  };
  strm.terminate = function() {
    w2.terminate();
  };
  if (flush) {
    strm.flush = function() {
      w2.postMessage([]);
    };
  }
};
var b2 = function(d, b3) {
  return d[b3] | d[b3 + 1] << 8;
};
var b4 = function(d, b3) {
  return (d[b3] | d[b3 + 1] << 8 | d[b3 + 2] << 16 | d[b3 + 3] << 24) >>> 0;
};
var b8 = function(d, b3) {
  return b4(d, b3) + b4(d, b3 + 4) * 4294967296;
};
var wbytes = function(d, b3, v2) {
  for (; v2; ++b3)
    d[b3] = v2, v2 >>>= 8;
};
var gzh = function(c, o) {
  var fn = o.filename;
  c[0] = 31, c[1] = 139, c[2] = 8, c[8] = o.level < 2 ? 4 : o.level == 9 ? 2 : 0, c[9] = 3;
  if (o.mtime != 0)
    wbytes(c, 4, Math.floor(new Date(o.mtime || Date.now()) / 1e3));
  if (fn) {
    c[3] = 8;
    for (var i = 0; i <= fn.length; ++i)
      c[i + 10] = fn.charCodeAt(i);
  }
};
var gzs = function(d) {
  if (d[0] != 31 || d[1] != 139 || d[2] != 8)
    err(6, "invalid gzip data");
  var flg = d[3];
  var st = 10;
  if (flg & 4)
    st += (d[10] | d[11] << 8) + 2;
  for (var zs = (flg >> 3 & 1) + (flg >> 4 & 1); zs > 0; zs -= !d[st++])
    ;
  return st + (flg & 2);
};
var gzl = function(d) {
  var l2 = d.length;
  return (d[l2 - 4] | d[l2 - 3] << 8 | d[l2 - 2] << 16 | d[l2 - 1] << 24) >>> 0;
};
var gzhl = function(o) {
  return 10 + (o.filename ? o.filename.length + 1 : 0);
};
var zlh = function(c, o) {
  var lv = o.level, fl2 = lv == 0 ? 0 : lv < 6 ? 1 : lv == 9 ? 3 : 2;
  c[0] = 120, c[1] = fl2 << 6 | (o.dictionary && 32);
  c[1] |= 31 - (c[0] << 8 | c[1]) % 31;
  if (o.dictionary) {
    var h = adler();
    h.p(o.dictionary);
    wbytes(c, 2, h.d());
  }
};
var zls = function(d, dict) {
  if ((d[0] & 15) != 8 || d[0] >> 4 > 7 || (d[0] << 8 | d[1]) % 31)
    err(6, "invalid zlib data");
  if ((d[1] >> 5 & 1) == +!dict)
    err(6, "invalid zlib data: " + (d[1] & 32 ? "need" : "unexpected") + " dictionary");
  return (d[1] >> 3 & 4) + 2;
};
function StrmOpt(opts, cb) {
  if (typeof opts == "function")
    cb = opts, opts = {};
  this.ondata = cb;
  return opts;
}
var Deflate = (function() {
  function Deflate2(opts, cb) {
    if (typeof opts == "function")
      cb = opts, opts = {};
    this.ondata = cb;
    this.o = opts || {};
    this.s = { l: 0, i: 32768, w: 32768, z: 32768 };
    this.b = new u8(98304);
    if (this.o.dictionary) {
      var dict = this.o.dictionary.subarray(-32768);
      this.b.set(dict, 32768 - dict.length);
      this.s.i = 32768 - dict.length;
    }
  }
  Deflate2.prototype.p = function(c, f) {
    this.ondata(dopt(c, this.o, 0, 0, this.s), f);
  };
  Deflate2.prototype.push = function(chunk, final) {
    if (!this.ondata)
      err(5);
    if (this.s.l)
      err(4);
    var endLen = chunk.length + this.s.z;
    if (endLen > this.b.length) {
      if (endLen > 2 * this.b.length - 32768) {
        var newBuf = new u8(endLen & -32768);
        newBuf.set(this.b.subarray(0, this.s.z));
        this.b = newBuf;
      }
      var split = this.b.length - this.s.z;
      this.b.set(chunk.subarray(0, split), this.s.z);
      this.s.z = this.b.length;
      this.p(this.b, false);
      this.b.set(this.b.subarray(-32768));
      this.b.set(chunk.subarray(split), 32768);
      this.s.z = chunk.length - split + 32768;
      this.s.i = 32766, this.s.w = 32768;
    } else {
      this.b.set(chunk, this.s.z);
      this.s.z += chunk.length;
    }
    this.s.l = final & 1;
    if (this.s.z > this.s.w + 8191 || final) {
      this.p(this.b, final || false);
      this.s.w = this.s.i, this.s.i -= 2;
    }
  };
  Deflate2.prototype.flush = function() {
    if (!this.ondata)
      err(5);
    if (this.s.l)
      err(4);
    this.p(this.b, false);
    this.s.w = this.s.i, this.s.i -= 2;
  };
  return Deflate2;
})();
var AsyncDeflate = /* @__PURE__ */ (function() {
  function AsyncDeflate2(opts, cb) {
    astrmify([
      bDflt,
      function() {
        return [astrm, Deflate];
      }
    ], this, StrmOpt.call(this, opts, cb), function(ev) {
      var strm = new Deflate(ev.data);
      onmessage = astrm(strm);
    }, 6, 1);
  }
  return AsyncDeflate2;
})();
function deflateSync(data, opts) {
  return dopt(data, opts || {}, 0, 0);
}
var Inflate = (function() {
  function Inflate2(opts, cb) {
    if (typeof opts == "function")
      cb = opts, opts = {};
    this.ondata = cb;
    var dict = opts && opts.dictionary && opts.dictionary.subarray(-32768);
    this.s = { i: 0, b: dict ? dict.length : 0 };
    this.o = new u8(32768);
    this.p = new u8(0);
    if (dict)
      this.o.set(dict);
  }
  Inflate2.prototype.e = function(c) {
    if (!this.ondata)
      err(5);
    if (this.d)
      err(4);
    if (!this.p.length)
      this.p = c;
    else if (c.length) {
      var n = new u8(this.p.length + c.length);
      n.set(this.p), n.set(c, this.p.length), this.p = n;
    }
  };
  Inflate2.prototype.c = function(final) {
    this.s.i = +(this.d = final || false);
    var bts = this.s.b;
    var dt = inflt(this.p, this.s, this.o);
    this.ondata(slc(dt, bts, this.s.b), this.d);
    this.o = slc(dt, this.s.b - 32768), this.s.b = this.o.length;
    this.p = slc(this.p, this.s.p / 8 | 0), this.s.p &= 7;
  };
  Inflate2.prototype.push = function(chunk, final) {
    this.e(chunk), this.c(final);
  };
  return Inflate2;
})();
var AsyncInflate = /* @__PURE__ */ (function() {
  function AsyncInflate2(opts, cb) {
    astrmify([
      bInflt,
      function() {
        return [astrm, Inflate];
      }
    ], this, StrmOpt.call(this, opts, cb), function(ev) {
      var strm = new Inflate(ev.data);
      onmessage = astrm(strm);
    }, 7, 0);
  }
  return AsyncInflate2;
})();
function inflateSync(data, opts) {
  return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
var Gzip = (function() {
  function Gzip2(opts, cb) {
    this.c = crc();
    this.l = 0;
    this.v = 1;
    Deflate.call(this, opts, cb);
  }
  Gzip2.prototype.push = function(chunk, final) {
    this.c.p(chunk);
    this.l += chunk.length;
    Deflate.prototype.push.call(this, chunk, final);
  };
  Gzip2.prototype.p = function(c, f) {
    var raw = dopt(c, this.o, this.v && gzhl(this.o), f && 8, this.s);
    if (this.v)
      gzh(raw, this.o), this.v = 0;
    if (f)
      wbytes(raw, raw.length - 8, this.c.d()), wbytes(raw, raw.length - 4, this.l);
    this.ondata(raw, f);
  };
  Gzip2.prototype.flush = function() {
    Deflate.prototype.flush.call(this);
  };
  return Gzip2;
})();
var Gunzip = (function() {
  function Gunzip2(opts, cb) {
    this.v = 1;
    this.r = 0;
    Inflate.call(this, opts, cb);
  }
  Gunzip2.prototype.push = function(chunk, final) {
    Inflate.prototype.e.call(this, chunk);
    this.r += chunk.length;
    if (this.v) {
      var p = this.p.subarray(this.v - 1);
      var s = p.length > 3 ? gzs(p) : 4;
      if (s > p.length) {
        if (!final)
          return;
      } else if (this.v > 1 && this.onmember) {
        this.onmember(this.r - p.length);
      }
      this.p = p.subarray(s), this.v = 0;
    }
    Inflate.prototype.c.call(this, final);
    if (this.s.f && !this.s.l && !final) {
      this.v = shft(this.s.p) + 9;
      this.s = { i: 0 };
      this.o = new u8(0);
      this.push(new u8(0), final);
    }
  };
  return Gunzip2;
})();
var AsyncGunzip = /* @__PURE__ */ (function() {
  function AsyncGunzip2(opts, cb) {
    var _this = this;
    astrmify([
      bInflt,
      guze,
      function() {
        return [astrm, Inflate, Gunzip];
      }
    ], this, StrmOpt.call(this, opts, cb), function(ev) {
      var strm = new Gunzip(ev.data);
      strm.onmember = function(offset) {
        return postMessage(offset);
      };
      onmessage = astrm(strm);
    }, 9, 0, function(offset) {
      return _this.onmember && _this.onmember(offset);
    });
  }
  return AsyncGunzip2;
})();
function gunzipSync(data, opts) {
  var st = gzs(data);
  if (st + 8 > data.length)
    err(6, "invalid gzip data");
  return inflt(data.subarray(st, -8), { i: 2 }, opts && opts.out || new u8(gzl(data)), opts && opts.dictionary);
}
var Zlib = (function() {
  function Zlib2(opts, cb) {
    this.c = adler();
    this.v = 1;
    Deflate.call(this, opts, cb);
  }
  Zlib2.prototype.push = function(chunk, final) {
    this.c.p(chunk);
    Deflate.prototype.push.call(this, chunk, final);
  };
  Zlib2.prototype.p = function(c, f) {
    var raw = dopt(c, this.o, this.v && (this.o.dictionary ? 6 : 2), f && 4, this.s);
    if (this.v)
      zlh(raw, this.o), this.v = 0;
    if (f)
      wbytes(raw, raw.length - 4, this.c.d());
    this.ondata(raw, f);
  };
  Zlib2.prototype.flush = function() {
    Deflate.prototype.flush.call(this);
  };
  return Zlib2;
})();
var Unzlib = (function() {
  function Unzlib2(opts, cb) {
    Inflate.call(this, opts, cb);
    this.v = opts && opts.dictionary ? 2 : 1;
  }
  Unzlib2.prototype.push = function(chunk, final) {
    Inflate.prototype.e.call(this, chunk);
    if (this.v) {
      if (this.p.length < 6 && !final)
        return;
      this.p = this.p.subarray(zls(this.p, this.v - 1)), this.v = 0;
    }
    if (final) {
      if (this.p.length < 4)
        err(6, "invalid zlib data");
      this.p = this.p.subarray(0, -4);
    }
    Inflate.prototype.c.call(this, final);
  };
  return Unzlib2;
})();
var AsyncUnzlib = /* @__PURE__ */ (function() {
  function AsyncUnzlib2(opts, cb) {
    astrmify([
      bInflt,
      zule,
      function() {
        return [astrm, Inflate, Unzlib];
      }
    ], this, StrmOpt.call(this, opts, cb), function(ev) {
      var strm = new Unzlib(ev.data);
      onmessage = astrm(strm);
    }, 11, 0);
  }
  return AsyncUnzlib2;
})();
function unzlibSync(data, opts) {
  return inflt(data.subarray(zls(data, opts && opts.dictionary), -4), { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
var Decompress = (function() {
  function Decompress2(opts, cb) {
    this.o = StrmOpt.call(this, opts, cb) || {};
    this.G = Gunzip;
    this.I = Inflate;
    this.Z = Unzlib;
  }
  Decompress2.prototype.i = function() {
    var _this = this;
    this.s.ondata = function(dat, final) {
      _this.ondata(dat, final);
    };
  };
  Decompress2.prototype.push = function(chunk, final) {
    if (!this.ondata)
      err(5);
    if (!this.s) {
      if (this.p && this.p.length) {
        var n = new u8(this.p.length + chunk.length);
        n.set(this.p), n.set(chunk, this.p.length);
      } else
        this.p = chunk;
      if (this.p.length > 2) {
        this.s = this.p[0] == 31 && this.p[1] == 139 && this.p[2] == 8 ? new this.G(this.o) : (this.p[0] & 15) != 8 || this.p[0] >> 4 > 7 || (this.p[0] << 8 | this.p[1]) % 31 ? new this.I(this.o) : new this.Z(this.o);
        this.i();
        this.s.push(this.p, final);
        this.p = null;
      }
    } else
      this.s.push(chunk, final);
  };
  return Decompress2;
})();
var AsyncDecompress = (function() {
  function AsyncDecompress2(opts, cb) {
    Decompress.call(this, opts, cb);
    this.queuedSize = 0;
    this.G = AsyncGunzip;
    this.I = AsyncInflate;
    this.Z = AsyncUnzlib;
  }
  AsyncDecompress2.prototype.i = function() {
    var _this = this;
    this.s.ondata = function(err2, dat, final) {
      _this.ondata(err2, dat, final);
    };
    this.s.ondrain = function(size) {
      _this.queuedSize -= size;
      if (_this.ondrain)
        _this.ondrain(size);
    };
  };
  AsyncDecompress2.prototype.push = function(chunk, final) {
    this.queuedSize += chunk.length;
    Decompress.prototype.push.call(this, chunk, final);
  };
  return AsyncDecompress2;
})();
function decompressSync(data, opts) {
  return data[0] == 31 && data[1] == 139 && data[2] == 8 ? gunzipSync(data, opts) : (data[0] & 15) != 8 || data[0] >> 4 > 7 || (data[0] << 8 | data[1]) % 31 ? inflateSync(data, opts) : unzlibSync(data, opts);
}
var te = typeof TextEncoder != "undefined" && new TextEncoder();
var td = typeof TextDecoder != "undefined" && new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
var dutf8 = function(d) {
  for (var r = "", i = 0; ; ) {
    var c = d[i++];
    var eb = (c > 127) + (c > 223) + (c > 239);
    if (i + eb > d.length)
      return { s: r, r: slc(d, i - 1) };
    if (!eb)
      r += String.fromCharCode(c);
    else if (eb == 3) {
      c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | d[i++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
    } else if (eb & 1)
      r += String.fromCharCode((c & 31) << 6 | d[i++] & 63);
    else
      r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | d[i++] & 63);
  }
};
var DecodeUTF8 = (function() {
  function DecodeUTF82(cb) {
    this.ondata = cb;
    if (tds)
      this.t = new TextDecoder();
    else
      this.p = et;
  }
  DecodeUTF82.prototype.push = function(chunk, final) {
    if (!this.ondata)
      err(5);
    final = !!final;
    if (this.t) {
      this.ondata(this.t.decode(chunk, { stream: true }), final);
      if (final) {
        if (this.t.decode().length)
          err(8);
        this.t = null;
      }
      return;
    }
    if (!this.p)
      err(4);
    var dat = new u8(this.p.length + chunk.length);
    dat.set(this.p);
    dat.set(chunk, this.p.length);
    var _a2 = dutf8(dat), s = _a2.s, r = _a2.r;
    if (final) {
      if (r.length)
        err(8);
      this.p = null;
    } else
      this.p = r;
    this.ondata(s, final);
  };
  return DecodeUTF82;
})();
var EncodeUTF8 = (function() {
  function EncodeUTF82(cb) {
    this.ondata = cb;
  }
  EncodeUTF82.prototype.push = function(chunk, final) {
    if (!this.ondata)
      err(5);
    if (this.d)
      err(4);
    this.ondata(strToU8(chunk), this.d = final || false);
  };
  return EncodeUTF82;
})();
function strToU8(str, latin1) {
  if (latin1) {
    var ar_1 = new u8(str.length);
    for (var i = 0; i < str.length; ++i)
      ar_1[i] = str.charCodeAt(i);
    return ar_1;
  }
  if (te)
    return te.encode(str);
  var l2 = str.length;
  var ar = new u8(str.length + (str.length >> 1));
  var ai = 0;
  var w2 = function(v2) {
    ar[ai++] = v2;
  };
  for (var i = 0; i < l2; ++i) {
    if (ai + 5 > ar.length) {
      var n = new u8(ai + 8 + (l2 - i << 1));
      n.set(ar);
      ar = n;
    }
    var c = str.charCodeAt(i);
    if (c < 128 || latin1)
      w2(c);
    else if (c < 2048)
      w2(192 | c >> 6), w2(128 | c & 63);
    else if (c > 55295 && c < 57344)
      c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i) & 1023, w2(240 | c >> 18), w2(128 | c >> 12 & 63), w2(128 | c >> 6 & 63), w2(128 | c & 63);
    else
      w2(224 | c >> 12), w2(128 | c >> 6 & 63), w2(128 | c & 63);
  }
  return slc(ar, 0, ai);
}
function strFromU8(dat, latin1) {
  if (latin1) {
    var r = "";
    for (var i = 0; i < dat.length; i += 16384)
      r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
    return r;
  } else if (td) {
    return td.decode(dat);
  } else {
    var _a2 = dutf8(dat), s = _a2.s, r = _a2.r;
    if (r.length)
      err(8);
    return s;
  }
}
var dbf = function(l2) {
  return l2 == 1 ? 3 : l2 < 6 ? 2 : l2 == 9 ? 1 : 0;
};
var z64e = function(d, b3) {
  for (; b2(d, b3) != 1; b3 += 4 + b2(d, b3 + 2))
    ;
  return [b8(d, b3 + 12), b8(d, b3 + 4), b8(d, b3 + 20)];
};
var exfl = function(ex) {
  var le = 0;
  if (ex) {
    for (var k2 in ex) {
      var l2 = ex[k2].length;
      if (l2 > 65535)
        err(9);
      le += l2 + 4;
    }
  }
  return le;
};
var wzh = function(d, b3, f, fn, u, c, ce, co) {
  var fl2 = fn.length, ex = f.extra, col = co && co.length;
  var exl = exfl(ex);
  wbytes(d, b3, ce != null ? 33639248 : 67324752), b3 += 4;
  if (ce != null)
    d[b3++] = 20, d[b3++] = f.os;
  d[b3] = 20, b3 += 2;
  d[b3++] = f.flag << 1 | (c < 0 && 8), d[b3++] = u && 8;
  d[b3++] = f.compression & 255, d[b3++] = f.compression >> 8;
  var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
  if (y < 0 || y > 119)
    err(10);
  wbytes(d, b3, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), b3 += 4;
  if (c != -1) {
    wbytes(d, b3, f.crc);
    wbytes(d, b3 + 4, c < 0 ? -c - 2 : c);
    wbytes(d, b3 + 8, f.size);
  }
  wbytes(d, b3 + 12, fl2);
  wbytes(d, b3 + 14, exl), b3 += 16;
  if (ce != null) {
    wbytes(d, b3, col);
    wbytes(d, b3 + 6, f.attrs);
    wbytes(d, b3 + 10, ce), b3 += 14;
  }
  d.set(fn, b3);
  b3 += fl2;
  if (exl) {
    for (var k2 in ex) {
      var exf = ex[k2], l2 = exf.length;
      wbytes(d, b3, +k2);
      wbytes(d, b3 + 2, l2);
      d.set(exf, b3 + 4), b3 += 4 + l2;
    }
  }
  if (col)
    d.set(co, b3), b3 += col;
  return b3;
};
var wzf = function(o, b3, c, d, e) {
  wbytes(o, b3, 101010256);
  wbytes(o, b3 + 8, c);
  wbytes(o, b3 + 10, c);
  wbytes(o, b3 + 12, d);
  wbytes(o, b3 + 16, e);
};
var ZipPassThrough = (function() {
  function ZipPassThrough2(filename) {
    this.filename = filename;
    this.c = crc();
    this.size = 0;
    this.compression = 0;
  }
  ZipPassThrough2.prototype.process = function(chunk, final) {
    this.ondata(null, chunk, final);
  };
  ZipPassThrough2.prototype.push = function(chunk, final) {
    if (!this.ondata)
      err(5);
    this.c.p(chunk);
    this.size += chunk.length;
    if (final)
      this.crc = this.c.d();
    this.process(chunk, final || false);
  };
  return ZipPassThrough2;
})();
var ZipDeflate = (function() {
  function ZipDeflate2(filename, opts) {
    var _this = this;
    if (!opts)
      opts = {};
    ZipPassThrough.call(this, filename);
    this.d = new Deflate(opts, function(dat, final) {
      _this.ondata(null, dat, final);
    });
    this.compression = 8;
    this.flag = dbf(opts.level);
  }
  ZipDeflate2.prototype.process = function(chunk, final) {
    try {
      this.d.push(chunk, final);
    } catch (e) {
      this.ondata(e, null, final);
    }
  };
  ZipDeflate2.prototype.push = function(chunk, final) {
    ZipPassThrough.prototype.push.call(this, chunk, final);
  };
  return ZipDeflate2;
})();
var AsyncZipDeflate = (function() {
  function AsyncZipDeflate2(filename, opts) {
    var _this = this;
    if (!opts)
      opts = {};
    ZipPassThrough.call(this, filename);
    this.d = new AsyncDeflate(opts, function(err2, dat, final) {
      _this.ondata(err2, dat, final);
    });
    this.compression = 8;
    this.flag = dbf(opts.level);
    this.terminate = this.d.terminate;
  }
  AsyncZipDeflate2.prototype.process = function(chunk, final) {
    this.d.push(chunk, final);
  };
  AsyncZipDeflate2.prototype.push = function(chunk, final) {
    ZipPassThrough.prototype.push.call(this, chunk, final);
  };
  return AsyncZipDeflate2;
})();
var Zip = (function() {
  function Zip2(cb) {
    this.ondata = cb;
    this.u = [];
    this.d = 1;
  }
  Zip2.prototype.add = function(file) {
    var _this = this;
    if (!this.ondata)
      err(5);
    if (this.d & 2)
      this.ondata(err(4 + (this.d & 1) * 8, 0, 1), null, false);
    else {
      var f = strToU8(file.filename), fl_1 = f.length;
      var com = file.comment, o = com && strToU8(com);
      var u = fl_1 != file.filename.length || o && com.length != o.length;
      var hl_1 = fl_1 + exfl(file.extra) + 30;
      if (fl_1 > 65535)
        this.ondata(err(11, 0, 1), null, false);
      var header = new u8(hl_1);
      wzh(header, 0, file, f, u, -1);
      var chks_1 = [header];
      var pAll_1 = function() {
        for (var _i = 0, chks_2 = chks_1; _i < chks_2.length; _i++) {
          var chk = chks_2[_i];
          _this.ondata(null, chk, false);
        }
        chks_1 = [];
      };
      var tr_1 = this.d;
      this.d = 0;
      var ind_1 = this.u.length;
      var uf_1 = mrg(file, {
        f,
        u,
        o,
        t: function() {
          if (file.terminate)
            file.terminate();
        },
        r: function() {
          pAll_1();
          if (tr_1) {
            var nxt = _this.u[ind_1 + 1];
            if (nxt)
              nxt.r();
            else
              _this.d = 1;
          }
          tr_1 = 1;
        }
      });
      var cl_1 = 0;
      file.ondata = function(err2, dat, final) {
        if (err2) {
          _this.ondata(err2, dat, final);
          _this.terminate();
        } else {
          cl_1 += dat.length;
          chks_1.push(dat);
          if (final) {
            var dd = new u8(16);
            wbytes(dd, 0, 134695760);
            wbytes(dd, 4, file.crc);
            wbytes(dd, 8, cl_1);
            wbytes(dd, 12, file.size);
            chks_1.push(dd);
            uf_1.c = cl_1, uf_1.b = hl_1 + cl_1 + 16, uf_1.crc = file.crc, uf_1.size = file.size;
            if (tr_1)
              uf_1.r();
            tr_1 = 1;
          } else if (tr_1)
            pAll_1();
        }
      };
      this.u.push(uf_1);
    }
  };
  Zip2.prototype.end = function() {
    var _this = this;
    if (this.d & 2) {
      this.ondata(err(4 + (this.d & 1) * 8, 0, 1), null, true);
      return;
    }
    if (this.d)
      this.e();
    else
      this.u.push({
        r: function() {
          if (!(_this.d & 1))
            return;
          _this.u.splice(-1, 1);
          _this.e();
        },
        t: function() {
        }
      });
    this.d = 3;
  };
  Zip2.prototype.e = function() {
    var bt = 0, l2 = 0, tl = 0;
    for (var _i = 0, _a2 = this.u; _i < _a2.length; _i++) {
      var f = _a2[_i];
      tl += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0);
    }
    var out = new u8(tl + 22);
    for (var _b2 = 0, _c = this.u; _b2 < _c.length; _b2++) {
      var f = _c[_b2];
      wzh(out, bt, f, f.f, f.u, -f.c - 2, l2, f.o);
      bt += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0), l2 += f.b;
    }
    wzf(out, bt, this.u.length, tl, l2);
    this.ondata(null, out, true);
    this.d = 2;
  };
  Zip2.prototype.terminate = function() {
    for (var _i = 0, _a2 = this.u; _i < _a2.length; _i++) {
      var f = _a2[_i];
      f.t();
    }
    this.d = 2;
  };
  return Zip2;
})();
var UnzipPassThrough = (function() {
  function UnzipPassThrough2() {
  }
  UnzipPassThrough2.prototype.push = function(data, final) {
    this.ondata(null, data, final);
  };
  UnzipPassThrough2.compression = 0;
  return UnzipPassThrough2;
})();
var UnzipInflate = (function() {
  function UnzipInflate2() {
    var _this = this;
    this.i = new Inflate(function(dat, final) {
      _this.ondata(null, dat, final);
    });
  }
  UnzipInflate2.prototype.push = function(data, final) {
    try {
      this.i.push(data, final);
    } catch (e) {
      this.ondata(e, null, final);
    }
  };
  UnzipInflate2.compression = 8;
  return UnzipInflate2;
})();
var AsyncUnzipInflate = (function() {
  function AsyncUnzipInflate2(_2, sz) {
    var _this = this;
    if (sz < 32e4) {
      this.i = new Inflate(function(dat, final) {
        _this.ondata(null, dat, final);
      });
    } else {
      this.i = new AsyncInflate(function(err2, dat, final) {
        _this.ondata(err2, dat, final);
      });
      this.terminate = this.i.terminate;
    }
  }
  AsyncUnzipInflate2.prototype.push = function(data, final) {
    if (this.i.terminate)
      data = slc(data, 0);
    this.i.push(data, final);
  };
  AsyncUnzipInflate2.compression = 8;
  return AsyncUnzipInflate2;
})();
var Unzip = (function() {
  function Unzip2(cb) {
    this.onfile = cb;
    this.k = [];
    this.o = {
      0: UnzipPassThrough
    };
    this.p = et;
  }
  Unzip2.prototype.push = function(chunk, final) {
    var _this = this;
    if (!this.onfile)
      err(5);
    if (!this.p)
      err(4);
    if (this.c > 0) {
      var len = Math.min(this.c, chunk.length);
      var toAdd = chunk.subarray(0, len);
      this.c -= len;
      if (this.d)
        this.d.push(toAdd, !this.c);
      else
        this.k[0].push(toAdd);
      chunk = chunk.subarray(len);
      if (chunk.length)
        return this.push(chunk, final);
    } else {
      var f = 0, i = 0, is = void 0, buf = void 0;
      if (!this.p.length)
        buf = chunk;
      else if (!chunk.length)
        buf = this.p;
      else {
        buf = new u8(this.p.length + chunk.length);
        buf.set(this.p), buf.set(chunk, this.p.length);
      }
      var l2 = buf.length, oc = this.c, add = oc && this.d;
      var _loop_2 = function() {
        var _a2;
        var sig = b4(buf, i);
        if (sig == 67324752) {
          f = 1, is = i;
          this_1.d = null;
          this_1.c = 0;
          var bf = b2(buf, i + 6), cmp_1 = b2(buf, i + 8), u = bf & 2048, dd = bf & 8, fnl = b2(buf, i + 26), es = b2(buf, i + 28);
          if (l2 > i + 30 + fnl + es) {
            var chks_3 = [];
            this_1.k.unshift(chks_3);
            f = 2;
            var sc_1 = b4(buf, i + 18), su_1 = b4(buf, i + 22);
            var fn_1 = strFromU8(buf.subarray(i + 30, i += 30 + fnl), !u);
            if (sc_1 == 4294967295) {
              _a2 = dd ? [-2] : z64e(buf, i), sc_1 = _a2[0], su_1 = _a2[1];
            } else if (dd)
              sc_1 = -1;
            i += es;
            this_1.c = sc_1;
            var d_1;
            var file_1 = {
              name: fn_1,
              compression: cmp_1,
              start: function() {
                if (!file_1.ondata)
                  err(5);
                if (!sc_1)
                  file_1.ondata(null, et, true);
                else {
                  var ctr = _this.o[cmp_1];
                  if (!ctr)
                    file_1.ondata(err(14, "unknown compression type " + cmp_1, 1), null, false);
                  d_1 = sc_1 < 0 ? new ctr(fn_1) : new ctr(fn_1, sc_1, su_1);
                  d_1.ondata = function(err2, dat3, final2) {
                    file_1.ondata(err2, dat3, final2);
                  };
                  for (var _i = 0, chks_4 = chks_3; _i < chks_4.length; _i++) {
                    var dat2 = chks_4[_i];
                    d_1.push(dat2, false);
                  }
                  if (_this.k[0] == chks_3 && _this.c)
                    _this.d = d_1;
                  else
                    d_1.push(et, true);
                }
              },
              terminate: function() {
                if (d_1 && d_1.terminate)
                  d_1.terminate();
              }
            };
            if (sc_1 >= 0)
              file_1.size = sc_1, file_1.originalSize = su_1;
            this_1.onfile(file_1);
          }
          return "break";
        } else if (oc) {
          if (sig == 134695760) {
            is = i += 12 + (oc == -2 && 8), f = 3, this_1.c = 0;
            return "break";
          } else if (sig == 33639248) {
            is = i -= 4, f = 3, this_1.c = 0;
            return "break";
          }
        }
      };
      var this_1 = this;
      for (; i < l2 - 4; ++i) {
        var state_1 = _loop_2();
        if (state_1 === "break")
          break;
      }
      this.p = et;
      if (oc < 0) {
        var dat = f ? buf.subarray(0, is - 12 - (oc == -2 && 8) - (b4(buf, is - 16) == 134695760 && 4)) : buf.subarray(0, i);
        if (add)
          add.push(dat, !!f);
        else
          this.k[+(f == 2)].push(dat);
      }
      if (f & 2)
        return this.push(buf.subarray(i), final);
      this.p = buf.subarray(i);
    }
    if (final) {
      if (this.c)
        err(13);
      this.p = null;
    }
  };
  Unzip2.prototype.register = function(decoder) {
    this.o[decoder.compression] = decoder;
  };
  return Unzip2;
})();

// website/node_modules/pmtiles/dist/esm/index.js
var z = Object.defineProperty;
var b = Math.pow;
var l = (i, e) => z(i, "name", { value: e, configurable: true });
var m = (i, e, t) => new Promise((r, n) => {
  var s = (u) => {
    try {
      a(t.next(u));
    } catch (c) {
      n(c);
    }
  }, o = (u) => {
    try {
      a(t.throw(u));
    } catch (c) {
      n(c);
    }
  }, a = (u) => u.done ? r(u.value) : Promise.resolve(u.value).then(s, o);
  a((t = t.apply(i, e)).next());
});
var re = l((i, e) => {
  let t = false, r = "", n = L.GridLayer.extend({ createTile: l((s, o) => {
    let a = document.createElement("img"), u = new AbortController(), c = u.signal;
    return a.cancel = () => {
      u.abort();
    }, t || (i.getHeader().then((d) => {
      d.tileType === 1 ? console.error("Error: archive contains MVT vector tiles, but leafletRasterLayer is for displaying raster tiles. See https://github.com/protomaps/PMTiles/tree/main/js for details.") : d.tileType === 2 ? r = "image/png" : d.tileType === 3 ? r = "image/jpeg" : d.tileType === 4 ? r = "image/webp" : d.tileType === 5 && (r = "image/avif");
    }), t = true), i.getZxy(s.z, s.x, s.y, c).then((d) => {
      if (d) {
        let h = new Blob([d.data], { type: r }), p = window.URL.createObjectURL(h);
        a.src = p, a.cancel = void 0, o(void 0, a);
      }
    }).catch((d) => {
      if (d.name !== "AbortError") throw d;
    }), a;
  }, "createTile"), _removeTile: l(function(s) {
    let o = this._tiles[s];
    o && (o.el.cancel && o.el.cancel(), o.el.width = 0, o.el.height = 0, o.el.deleted = true, L.DomUtil.remove(o.el), delete this._tiles[s], this.fire("tileunload", { tile: o.el, coords: this._keyToTileCoords(s) }));
  }, "_removeTile") });
  return new n(e);
}, "leafletRasterLayer");
var j = l((i) => (e, t) => {
  if (t instanceof AbortController) return i(e, t);
  let r = new AbortController();
  return i(e, r).then((n) => t(void 0, n.data, n.cacheControl || "", n.expires || ""), (n) => t(n)).catch((n) => t(n)), { cancel: l(() => r.abort(), "cancel") };
}, "v3compat");
var T = class T2 {
  constructor(e) {
    this.tilev4 = l((e2, t) => m(this, null, function* () {
      if (e2.type === "json") {
        let p = e2.url.substr(10), y = this.tiles.get(p);
        if (y || (y = new x(p), this.tiles.set(p, y)), this.metadata) return { data: yield y.getTileJson(e2.url) };
        let f = yield y.getHeader();
        return (f.minLon >= f.maxLon || f.minLat >= f.maxLat) && console.error(`Bounds of PMTiles archive ${f.minLon},${f.minLat},${f.maxLon},${f.maxLat} are not valid.`), { data: { tiles: [`${e2.url}/{z}/{x}/{y}`], minzoom: f.minZoom, maxzoom: f.maxZoom, bounds: [f.minLon, f.minLat, f.maxLon, f.maxLat] } };
      }
      let r = new RegExp(/pmtiles:\/\/(.+)\/(\d+)\/(\d+)\/(\d+)/), n = e2.url.match(r);
      if (!n) throw new Error("Invalid PMTiles protocol URL");
      let s = n[1], o = this.tiles.get(s);
      o || (o = new x(s), this.tiles.set(s, o));
      let a = n[2], u = n[3], c = n[4], d = yield o.getHeader(), h = yield o == null ? void 0 : o.getZxy(+a, +u, +c, t.signal);
      if (h) return { data: new Uint8Array(h.data), cacheControl: h.cacheControl, expires: h.expires };
      if (d.tileType === 1) {
        if (this.errorOnMissingTile) throw new Error("Tile not found.");
        return { data: new Uint8Array() };
      }
      return { data: null };
    }), "tilev4");
    this.tile = j(this.tilev4);
    this.tiles = /* @__PURE__ */ new Map(), this.metadata = (e == null ? void 0 : e.metadata) || false, this.errorOnMissingTile = (e == null ? void 0 : e.errorOnMissingTile) || false;
  }
  add(e) {
    this.tiles.set(e.source.getKey(), e);
  }
  get(e) {
    return this.tiles.get(e);
  }
};
l(T, "Protocol");
var S = T;
function w(i, e) {
  return (e >>> 0) * 4294967296 + (i >>> 0);
}
l(w, "toNum");
function F(i, e) {
  let t = e.buf, r = t[e.pos++], n = (r & 112) >> 4;
  if (r < 128 || (r = t[e.pos++], n |= (r & 127) << 3, r < 128) || (r = t[e.pos++], n |= (r & 127) << 10, r < 128) || (r = t[e.pos++], n |= (r & 127) << 17, r < 128) || (r = t[e.pos++], n |= (r & 127) << 24, r < 128) || (r = t[e.pos++], n |= (r & 1) << 31, r < 128)) return w(i, n);
  throw new Error("Expected varint not more than 10 bytes");
}
l(F, "readVarintRemainder");
function v(i) {
  let e = i.buf, t = e[i.pos++], r = t & 127;
  return t < 128 || (t = e[i.pos++], r |= (t & 127) << 7, t < 128) || (t = e[i.pos++], r |= (t & 127) << 14, t < 128) || (t = e[i.pos++], r |= (t & 127) << 21, t < 128) ? r : (t = e[i.pos], r |= (t & 15) << 28, F(r, i));
}
l(v, "readVarint");
function k(i, e, t, r) {
  if (r === 0) {
    t === 1 && (e[0] = i - 1 - e[0], e[1] = i - 1 - e[1]);
    let n = e[0];
    e[0] = e[1], e[1] = n;
  }
}
l(k, "rotate");
function N(i, e) {
  let t = b(2, i), r = e, n = e, s = e, o = [0, 0], a = 1;
  for (; a < t; ) r = 1 & s / 2, n = 1 & (s ^ r), k(a, o, r, n), o[0] += a * r, o[1] += a * n, s = s / 4, a *= 2;
  return [i, o[0], o[1]];
}
l(N, "idOnLevel");
var q = [0, 1, 5, 21, 85, 341, 1365, 5461, 21845, 87381, 349525, 1398101, 5592405, 22369621, 89478485, 357913941, 1431655765, 5726623061, 22906492245, 91625968981, 366503875925, 1466015503701, 5864062014805, 23456248059221, 93824992236885, 375299968947541, 1501199875790165];
function G(i, e, t) {
  if (i > 26) throw new Error("Tile zoom level exceeds max safe number limit (26)");
  if (e > b(2, i) - 1 || t > b(2, i) - 1) throw new Error("tile x/y outside zoom level bounds");
  let r = q[i], n = b(2, i), s = 0, o = 0, a = 0, u = [e, t], c = n / 2;
  for (; c > 0; ) s = (u[0] & c) > 0 ? 1 : 0, o = (u[1] & c) > 0 ? 1 : 0, a += c * c * (3 * s ^ o), k(c, u, s, o), c = c / 2;
  return r + a;
}
l(G, "zxyToTileId");
function ie(i) {
  let e = 0, t = 0;
  for (let r = 0; r < 27; r++) {
    let n = (1 << r) * (1 << r);
    if (e + n > i) return N(r, i - e);
    e += n;
  }
  throw new Error("Tile zoom level exceeds max safe number limit (26)");
}
l(ie, "tileIdToZxy");
var J = ((s) => (s[s.Unknown = 0] = "Unknown", s[s.None = 1] = "None", s[s.Gzip = 2] = "Gzip", s[s.Brotli = 3] = "Brotli", s[s.Zstd = 4] = "Zstd", s))(J || {});
function D(i, e) {
  return m(this, null, function* () {
    if (e === 1 || e === 0) return i;
    if (e === 2) {
      if (typeof globalThis.DecompressionStream == "undefined") return decompressSync(new Uint8Array(i));
      let t = new Response(i).body;
      if (!t) throw new Error("Failed to read response stream");
      let r = t.pipeThrough(new globalThis.DecompressionStream("gzip"));
      return new Response(r).arrayBuffer();
    }
    throw new Error("Compression method not supported");
  });
}
l(D, "defaultDecompress");
var O = ((o) => (o[o.Unknown = 0] = "Unknown", o[o.Mvt = 1] = "Mvt", o[o.Png = 2] = "Png", o[o.Jpeg = 3] = "Jpeg", o[o.Webp = 4] = "Webp", o[o.Avif = 5] = "Avif", o))(O || {});
function _(i) {
  return i === 1 ? ".mvt" : i === 2 ? ".png" : i === 3 ? ".jpg" : i === 4 ? ".webp" : i === 5 ? ".avif" : "";
}
l(_, "tileTypeExt");
var Y = 127;
function Q(i, e) {
  let t = 0, r = i.length - 1;
  for (; t <= r; ) {
    let n = r + t >> 1, s = e - i[n].tileId;
    if (s > 0) t = n + 1;
    else if (s < 0) r = n - 1;
    else return i[n];
  }
  return r >= 0 && (i[r].runLength === 0 || e - i[r].tileId < i[r].runLength) ? i[r] : null;
}
l(Q, "findTile");
var A = class A2 {
  constructor(e) {
    this.file = e;
  }
  getKey() {
    return this.file.name;
  }
  getBytes(e, t) {
    return m(this, null, function* () {
      return { data: yield this.file.slice(e, e + t).arrayBuffer() };
    });
  }
};
l(A, "FileSource");
var V = A;
var U = class U2 {
  constructor(e, t = new Headers()) {
    this.url = e, this.customHeaders = t, this.mustReload = false;
    let r = "";
    "navigator" in globalThis && (r = globalThis.navigator.userAgent || "");
    let n = r.indexOf("Windows") > -1, s = /Chrome|Chromium|Edg|OPR|Brave/.test(r);
    this.chromeWindowsNoCache = false, n && s && (this.chromeWindowsNoCache = true);
  }
  getKey() {
    return this.url;
  }
  setHeaders(e) {
    this.customHeaders = e;
  }
  getBytes(e, t, r, n) {
    return m(this, null, function* () {
      let s, o;
      r ? o = r : (s = new AbortController(), o = s.signal);
      let a = new Headers(this.customHeaders);
      a.set("range", `bytes=${e}-${e + t - 1}`);
      let u;
      this.mustReload ? u = "reload" : this.chromeWindowsNoCache && (u = "no-store");
      let c = yield fetch(this.url, { signal: o, cache: u, headers: a });
      if (e === 0 && c.status === 416) {
        let y = c.headers.get("Content-Range");
        if (!y || !y.startsWith("bytes */")) throw new Error("Missing content-length on 416 response");
        let f = +y.substr(8);
        c = yield fetch(this.url, { signal: o, cache: "reload", headers: { range: `bytes=0-${f - 1}` } });
      }
      let d = c.headers.get("Etag");
      if (d != null && d.startsWith("W/") && (d = null), c.status === 416 || n && d && d !== n) throw this.mustReload = true, new E(`Server returned non-matching ETag ${n} after one retry. Check browser extensions and servers for issues that may affect correct ETag headers.`);
      if (c.status >= 300) throw new Error(`Bad response code: ${c.status}`);
      let h = c.headers.get("Content-Length");
      if (c.status === 200 && (!h || +h > t)) throw s && s.abort(), new Error("Server returned no content-length header or content-length exceeding request. Check that your storage backend supports HTTP Byte Serving.");
      return { data: yield c.arrayBuffer(), etag: d || void 0, cacheControl: c.headers.get("Cache-Control") || void 0, expires: c.headers.get("Expires") || void 0 };
    });
  }
};
l(U, "FetchSource");
var C = U;
function g(i, e) {
  let t = i.getUint32(e + 4, true), r = i.getUint32(e + 0, true);
  return t * b(2, 32) + r;
}
l(g, "getUint64");
function X(i, e) {
  let t = new DataView(i), r = t.getUint8(7);
  if (r > 3) throw new Error(`Archive is spec version ${r} but this library supports up to spec version 3`);
  return { specVersion: r, rootDirectoryOffset: g(t, 8), rootDirectoryLength: g(t, 16), jsonMetadataOffset: g(t, 24), jsonMetadataLength: g(t, 32), leafDirectoryOffset: g(t, 40), leafDirectoryLength: g(t, 48), tileDataOffset: g(t, 56), tileDataLength: g(t, 64), numAddressedTiles: g(t, 72), numTileEntries: g(t, 80), numTileContents: g(t, 88), clustered: t.getUint8(96) === 1, internalCompression: t.getUint8(97), tileCompression: t.getUint8(98), tileType: t.getUint8(99), minZoom: t.getUint8(100), maxZoom: t.getUint8(101), minLon: t.getInt32(102, true) / 1e7, minLat: t.getInt32(106, true) / 1e7, maxLon: t.getInt32(110, true) / 1e7, maxLat: t.getInt32(114, true) / 1e7, centerZoom: t.getUint8(118), centerLon: t.getInt32(119, true) / 1e7, centerLat: t.getInt32(123, true) / 1e7, etag: e };
}
l(X, "bytesToHeader");
function Z(i) {
  let e = { buf: new Uint8Array(i), pos: 0 }, t = v(e), r = [], n = 0;
  for (let s = 0; s < t; s++) {
    let o = v(e);
    r.push({ tileId: n + o, offset: 0, length: 0, runLength: 1 }), n += o;
  }
  for (let s = 0; s < t; s++) r[s].runLength = v(e);
  for (let s = 0; s < t; s++) r[s].length = v(e);
  for (let s = 0; s < t; s++) {
    let o = v(e);
    o === 0 && s > 0 ? r[s].offset = r[s - 1].offset + r[s - 1].length : r[s].offset = o - 1;
  }
  return r;
}
l(Z, "deserializeIndex");
var R = class R2 extends Error {
};
l(R, "EtagMismatch");
var E = R;
function K(i, e) {
  return m(this, null, function* () {
    let t = yield i.getBytes(0, 16384);
    if (new DataView(t.data).getUint16(0, true) !== 19792) throw new Error("Wrong magic number for PMTiles archive");
    let n = t.data.slice(0, Y), s = X(n, t.etag), o = t.data.slice(s.rootDirectoryOffset, s.rootDirectoryOffset + s.rootDirectoryLength), a = `${i.getKey()}|${s.etag || ""}|${s.rootDirectoryOffset}|${s.rootDirectoryLength}`, u = Z(yield e(o, s.internalCompression));
    return [s, [a, u.length, u]];
  });
}
l(K, "getHeaderAndRoot");
function I(i, e, t, r, n) {
  return m(this, null, function* () {
    let s = yield i.getBytes(t, r, void 0, n.etag), o = yield e(s.data, n.internalCompression), a = Z(o);
    if (a.length === 0) throw new Error("Empty directory is invalid");
    return a;
  });
}
l(I, "getDirectory");
var H = class H2 {
  constructor(e = 100, t = true, r = D) {
    this.cache = /* @__PURE__ */ new Map(), this.maxCacheEntries = e, this.counter = 1, this.decompress = r;
  }
  getHeader(e) {
    return m(this, null, function* () {
      let t = e.getKey(), r = this.cache.get(t);
      if (r) return r.lastUsed = this.counter++, r.data;
      let n = yield K(e, this.decompress);
      return n[1] && this.cache.set(n[1][0], { lastUsed: this.counter++, data: n[1][2] }), this.cache.set(t, { lastUsed: this.counter++, data: n[0] }), this.prune(), n[0];
    });
  }
  getDirectory(e, t, r, n) {
    return m(this, null, function* () {
      let s = `${e.getKey()}|${n.etag || ""}|${t}|${r}`, o = this.cache.get(s);
      if (o) return o.lastUsed = this.counter++, o.data;
      let a = yield I(e, this.decompress, t, r, n);
      return this.cache.set(s, { lastUsed: this.counter++, data: a }), this.prune(), a;
    });
  }
  prune() {
    if (this.cache.size > this.maxCacheEntries) {
      let e = 1 / 0, t;
      this.cache.forEach((r, n) => {
        r.lastUsed < e && (e = r.lastUsed, t = n);
      }), t && this.cache.delete(t);
    }
  }
  invalidate(e) {
    return m(this, null, function* () {
      this.cache.delete(e.getKey());
    });
  }
};
l(H, "ResolvedValueCache");
var $ = H;
var M = class M2 {
  constructor(e = 100, t = true, r = D) {
    this.cache = /* @__PURE__ */ new Map(), this.invalidations = /* @__PURE__ */ new Map(), this.maxCacheEntries = e, this.counter = 1, this.decompress = r;
  }
  getHeader(e) {
    return m(this, null, function* () {
      let t = e.getKey(), r = this.cache.get(t);
      if (r) return r.lastUsed = this.counter++, yield r.data;
      let n = new Promise((s, o) => {
        K(e, this.decompress).then((a) => {
          a[1] && this.cache.set(a[1][0], { lastUsed: this.counter++, data: Promise.resolve(a[1][2]) }), s(a[0]), this.prune();
        }).catch((a) => {
          o(a);
        });
      });
      return this.cache.set(t, { lastUsed: this.counter++, data: n }), n;
    });
  }
  getDirectory(e, t, r, n) {
    return m(this, null, function* () {
      let s = `${e.getKey()}|${n.etag || ""}|${t}|${r}`, o = this.cache.get(s);
      if (o) return o.lastUsed = this.counter++, yield o.data;
      let a = new Promise((u, c) => {
        I(e, this.decompress, t, r, n).then((d) => {
          u(d), this.prune();
        }).catch((d) => {
          c(d);
        });
      });
      return this.cache.set(s, { lastUsed: this.counter++, data: a }), a;
    });
  }
  prune() {
    if (this.cache.size >= this.maxCacheEntries) {
      let e = 1 / 0, t;
      this.cache.forEach((r, n) => {
        r.lastUsed < e && (e = r.lastUsed, t = n);
      }), t && this.cache.delete(t);
    }
  }
  invalidate(e) {
    return m(this, null, function* () {
      let t = e.getKey();
      if (this.invalidations.get(t)) return yield this.invalidations.get(t);
      this.cache.delete(e.getKey());
      let r = new Promise((n, s) => {
        this.getHeader(e).then((o) => {
          n(), this.invalidations.delete(t);
        }).catch((o) => {
          s(o);
        });
      });
      this.invalidations.set(t, r);
    });
  }
};
l(M, "SharedPromiseCache");
var P = M;
var B = class B2 {
  constructor(e, t, r) {
    typeof e == "string" ? this.source = new C(e) : this.source = e, r ? this.decompress = r : this.decompress = D, t ? this.cache = t : this.cache = new P();
  }
  getHeader() {
    return m(this, null, function* () {
      return yield this.cache.getHeader(this.source);
    });
  }
  getZxyAttempt(e, t, r, n) {
    return m(this, null, function* () {
      let s = G(e, t, r), o = yield this.cache.getHeader(this.source);
      if (e < o.minZoom || e > o.maxZoom) return;
      let a = o.rootDirectoryOffset, u = o.rootDirectoryLength;
      for (let c = 0; c <= 3; c++) {
        let d = yield this.cache.getDirectory(this.source, a, u, o), h = Q(d, s);
        if (h) {
          if (h.runLength > 0) {
            let p = yield this.source.getBytes(o.tileDataOffset + h.offset, h.length, n, o.etag);
            return { data: yield this.decompress(p.data, o.tileCompression), cacheControl: p.cacheControl, expires: p.expires };
          }
          a = o.leafDirectoryOffset + h.offset, u = h.length;
        } else return;
      }
      throw new Error("Maximum directory depth exceeded");
    });
  }
  getZxy(e, t, r, n) {
    return m(this, null, function* () {
      try {
        return yield this.getZxyAttempt(e, t, r, n);
      } catch (s) {
        if (s instanceof E) return this.cache.invalidate(this.source), yield this.getZxyAttempt(e, t, r, n);
        throw s;
      }
    });
  }
  getMetadataAttempt() {
    return m(this, null, function* () {
      let e = yield this.cache.getHeader(this.source), t = yield this.source.getBytes(e.jsonMetadataOffset, e.jsonMetadataLength, void 0, e.etag), r = yield this.decompress(t.data, e.internalCompression), n = new TextDecoder("utf-8");
      return JSON.parse(n.decode(r));
    });
  }
  getMetadata() {
    return m(this, null, function* () {
      try {
        return yield this.getMetadataAttempt();
      } catch (e) {
        if (e instanceof E) return this.cache.invalidate(this.source), yield this.getMetadataAttempt();
        throw e;
      }
    });
  }
  getTileJson(e) {
    return m(this, null, function* () {
      let t = yield this.getHeader(), r = yield this.getMetadata(), n = _(t.tileType);
      return { tilejson: "3.0.0", scheme: "xyz", tiles: [`${e}/{z}/{x}/{y}${n}`], vector_layers: r.vector_layers, attribution: r.attribution, description: r.description, name: r.name, version: r.version, bounds: [t.minLon, t.minLat, t.maxLon, t.maxLat], center: [t.centerLon, t.centerLat, t.centerZoom], minzoom: t.minZoom, maxzoom: t.maxZoom };
    });
  }
};
l(B, "PMTiles");
var x = B;
export {
  J as Compression,
  E as EtagMismatch,
  C as FetchSource,
  V as FileSource,
  x as PMTiles,
  S as Protocol,
  $ as ResolvedValueCache,
  P as SharedPromiseCache,
  O as TileType,
  X as bytesToHeader,
  Q as findTile,
  g as getUint64,
  re as leafletRasterLayer,
  v as readVarint,
  ie as tileIdToZxy,
  _ as tileTypeExt,
  G as zxyToTileId
};
//# sourceMappingURL=pmtiles.js.map

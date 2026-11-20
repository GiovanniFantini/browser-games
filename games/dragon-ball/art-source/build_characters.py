"""Local, reproducible Blender mesh authoring from the approved reference sheets.

The sheets are projected as UV textures onto volumetric surfaces, not billboards.
Control sections and hair volumes are authored here; no AI 3D service is used.
Run with Blender --background --python this_file.py.
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector

BASE = Path(__file__).resolve().parent
OUT = BASE.parent / 'public' / 'models'
OUT.mkdir(parents=True, exist_ok=True)

def material(name, color, image=None):
    color=tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in color)
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Roughness'].default_value=1
    if image:
        tex=m.node_tree.nodes.new('ShaderNodeTexImage'); tex.image=image
        m.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
    return m

def build(kind):
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    g=kind=='goku'; scale=.0035 if g else .0039; floor=856 if g else 860; center=200
    image=bpy.data.images.load(str(BASE/kind/'concept-v1.png'),check_existing=True); image.pack()
    iw,ih=image.size
    atlas=material('concept-projection',(1,1,1),image)
    skin=material('skin',(.99,.75,.54)); hair=material('hair',(.016,.018,.025) if g else (.12,.61,.65))
    blue=material('cloth',(.075,.08,.33) if g else (.91,.30,.13))
    shoe=material('shoe',(.035,.04,.07) if g else (.07,.32,.46))
    red=material('red',(.72,.04,.025) if g else (.96,.16,.10))
    purple=material('purple',(.40,.17,.48)); brown=material('brown',(.36,.19,.08))
    meshes=[]
    def pt(x,y,depth=0): return Vector(((x-center)*scale,depth,(floor-y)*scale))
    def mesh(name,verts,faces,bone,back=None,back_offset=0):
        data=bpy.data.meshes.new(name); data.from_pydata(verts,[],faces); data.update()
        import bmesh
        bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(data);bm.free();data.update()
        obj=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(obj); meshes.append(obj)
        data.materials.append(atlas); data.materials.append(back or atlas)
        if name=='head':data.materials.append(hair)
        uv=data.uv_layers.new(name='ConceptProjection')
        for poly in data.polygons:
            # Blender front is -Y. Back of Bulma uses the rear drawing, not a mirrored front.
            rear=poly.normal.y>.15
            # Facial features belong to the front, never to the side/back of the skull.
            solid_side = name=='head' and poly.normal.y>-.50
            if name=='hair-cap' and poly.normal.y>-.65: solid_side=True
            poly.material_index=1 if rear or solid_side else 0
            if name=='head' and (rear or solid_side):
                screen_y=sum(floor-data.vertices[v].co.z/scale for v in poly.vertices)/len(poly.vertices)
                if screen_y < (235 if g else 170):poly.material_index=2
            for li in poly.loop_indices:
                p=data.vertices[data.loops[li].vertex_index].co
                px=p.x/scale+center; py=floor-p.z/scale
                if rear and back_offset: px=2*center-px+back_offset
                # Rear reference stays in its own drawing's coordinate window.
                uv.data[li].uv=(px/iw,1-py/ih)
            poly.use_smooth=True
        obj['binding']=bone
        return obj
    def loft(name,rings,bone,back=None,back_offset=0,n=24):
        # Rings: screen y, left/right silhouette, front/back depth, optional depth center.
        verts=[]; faces=[]
        for row in rings:
            y,l,r,depth,*rest=row; backdepth=rest[0] if rest else depth; cy=rest[1] if len(rest)>1 else 0
            for i in range(n):
                a=2*math.pi*i/n; x=(l+r)/2+(r-l)/2*math.sin(a); c=math.cos(a)
                d=cy-c*(depth if c>=0 else backdepth)
                # Shape a nose within the continuous face surface.
                if name=='head' and c>0:
                    nose_y=287 if g else 203
                    d-=.035*math.exp(-((x-200)/9)**2-((y-nose_y)/13)**2)*c
                verts.append(pt(x,y,d))
        for j in range(len(rings)-1):
            for i in range(n):
                a=j*n+i;b=j*n+(i+1)%n; faces.append((a,b,b+n,a+n))
        faces.append(tuple(reversed(range(n)))); faces.append(tuple((len(rings)-1)*n+i for i in range(n)))
        return mesh(name,verts,faces,bone,back,back_offset)
    def lock(name,base,tip,width,depth,bone,mat,cy=0):
        start=pt(*base,cy); end=pt(*tip,cy); axis=(end-start).normalized()
        across=Vector((axis.z,0,-axis.x)); zdir=Vector((0,1,0)); verts=[]; faces=[]; n=10
        for t,w in [(0,.65),(.23,1),(.56,.72),(.83,.34),(1,.006)]:
            p=start.lerp(end,t)
            for i in range(n):
                a=2*math.pi*i/n
                verts.append(p+across*(math.sin(a)*width*scale*w)+zdir*(math.cos(a)*depth*w))
        for j in range(4):
            for i in range(n):
                a=j*n+i;b=j*n+(i+1)%n;faces.append((a,b,b+n,a+n))
        faces.append(tuple(reversed(range(n))));faces.append(tuple(4*n+i for i in range(n)))
        ob=mesh(name,verts,faces,bone,mat);ob.data.materials[0]=mat
        return ob

    if g:
        loft('head',[(174,180,225,.18),(207,145,255,.24),(240,132,270,.26),(270,134,268,.25),(294,147,256,.23),(318,175,232,.15),(334,198,206,.035)],'head',skin,n=40)
        loft('neck',[(330,182,226,.09),(355,180,226,.10),(370,175,231,.11)],'torso',skin)
        loft('gi',[(350,126,284,.13),(370,117,292,.19),(410,128,277,.23),(450,139,266,.22),(477,144,260,.19),(492,139,265,.18),(535,134,270,.22)],'torso',blue)
        # Individual wide hair volumes, with an asymmetric silhouette and real depth.
        loft('hair-cap',[(83,179,212,.12,.20,.06),(125,136,251,.23,.30,.06),(175,117,275,.28,.34,.06),(215,126,277,.25,.31,.06),(247,141,264,.18,.24,.06)],'head',hair)
        # Cap uses solid ink material; eye and face detail remains on the head UV.
        meshes[-1].data.materials[0]=atlas
        for i,(base,tip,w,d) in enumerate([
            ((194,166),(79,36),47,.21),((149,177),(15,122),39,.18),
            ((142,217),(20,193),36,.17),((146,245),(57,258),22,.13),
            ((237,181),(368,196),30,.20),((252,219),(389,245),27,.17),
            ((258,246),(345,280),19,.13),((220,139),(249,84),17,.15)]):
            lock('hair-spike-'+str(i),base,tip,w,d,'head',hair,cy=.035)
        for i,(base,tip,w) in enumerate([((163,202),(143,256),12),((188,196),(172,252),15),((217,192),(202,247),14),((239,200),(232,245),11)]):
            lock('fringe-'+str(i),base,tip,w,.035,'head',hair,cy=-.255)
        for side in [-1,1]:
            x=side*75+200
            loft('ear',[(249,x-8,x+8,.075),(262,x-13,x+13,.09),(282,x-8,x+8,.06)],'head',skin,n=16)
        legrows=[(510,144,199,.19),(555,129,201,.23),(610,108,198,.23),(650,98,197,.21),(694,111,190,.20),(741,121,189,.19),(782,133,187,.13),(797,145,179,.10)]
        armrows=[(365,112,132,.08),(389,100,137,.095),(414,91,131,.085),(447,82,119,.075),(482,69,111,.08),(506,60,107,.085),(529,56,105,.095),(553,52,104,.105),(577,61,99,.08),(587,72,89,.04)]
    else:
        loft('head',[(94,178,225,.15),(131,146,251,.21),(162,142,255,.23),(197,147,254,.24),(224,163,238,.20),(244,191,212,.08)],'head',skin,n=40)
        loft('neck',[(237,186,218,.065),(257,184,220,.07),(271,177,227,.08)],'torso',skin)
        loft('dress',[(252,150,251,.11),(269,126,275,.15),(301,133,265,.17),(328,145,257,.15),(353,151,252,.14),(387,140,263,.18),(425,126,277,.23),(465,114,287,.27),(495,111,290,.29),(504,118,283,.28)],'torso',atlas,741)
        loft('hair-cap',[(53,166,221,.10,.17,.20),(75,145,243,.20,.24,.20),(112,133,259,.23,.25,.20),(146,136,259,.19,.22,.20),(181,146,251,.13,.20,.20)],'head',hair)
        meshes[-1].data.materials[0]=atlas
        # The fine bangs are carried by the curved head's UVs. Extra overlapping
        # projected locks doubled the ink lines and broke the face at game distance.
        # Braided ponytail behind the head, alternating overlapping tapered lobes.
        for i in range(6):
            x=265+(5 if i%2 else -3);y=112+i*20
            lock('braid-'+str(i),(x-5,y-11),(x+4,y+22),16,.065,'head',hair,cy=.19)
        lock('braid-tip',(269,221),(261,250),12,.055,'head',hair,cy=.19)
        for i,(base,tip) in enumerate([((204,62),(157,13)),((210,61),(269,21))]):
            lock('bow-'+str(i),base,tip,29,.055,'head',red,cy=.04)
            meshes[-1].data.materials[0]=atlas
        lock('bow-knot',(203,53),(213,67),12,.065,'head',red,cy=-.03)
        for x in [144,252]:loft('ear',[(163,x-7,x+7,.055),(180,x-10,x+10,.06),(198,x-5,x+5,.03)],'head',skin,n=16)
        legrows=[(485,132,192,.115),(526,137,190,.115),(566,146,184,.10),(602,149,181,.085),(636,143,184,.095),(674,139,186,.10),(715,145,183,.085),(748,145,185,.075)]
        armrows=[(284,113,140,.085),(315,105,139,.085),(347,99,130,.075),(379,91,123,.07),(410,82,115,.068),(441,77,111,.075),(467,75,110,.08),(489,81,109,.055)]

    # Body limbs are contiguous lofts. Weight blends, not detached spheres, bend the joints.
    for side in ['L','R']:
        mirror=side=='R'
        def mirrored(rows):return [(y,400-r,400-l,*rest) if mirror else (y,l,r,*rest) for y,l,r,*rest in rows]
        loft('arm.'+side,mirrored(armrows),'arm.'+side,skin)
        loft('leg.'+side,mirrored(legrows),'leg.'+side,blue if g else skin)
        rows=[(795,143,182,.11),(811,130,185,.14),(838,82,185,.20),(850,60,184,.20),(856,63,181,.18)] if g else [(714,143,187,.09),(753,140,189,.10),(794,138,190,.13),(827,113,192,.18),(850,78,193,.20),(860,81,191,.18)]
        loft('boot.'+side,mirrored(rows),'foot.'+side,shoe)
    if g:
        # Tail is genuine curved volume behind the belt, with its own rigid bone.
        curve=bpy.data.curves.new('tail','CURVE');curve.dimensions='3D';curve.bevel_depth=.045;curve.bevel_resolution=2
        sp=curve.splines.new('BEZIER');sp.bezier_points.add(4)
        for b,p in zip(sp.bezier_points,[(.05,.17,1.25),(.35,.33,1.30),(.55,.32,1.50),(.61,.26,1.63),(.72,.22,1.62)]):b.co=p;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
        ob=bpy.data.objects.new('tail',curve);bpy.context.collection.objects.link(ob);bpy.context.view_layer.objects.active=ob;ob.select_set(True);bpy.ops.object.convert(target='MESH');ob.select_set(False)
        ob=bpy.context.view_layer.objects.active;ob.data.materials.append(brown);ob['binding']='tail';meshes.append(ob)

    # Armature, retaining the authored neutral pose and deforming connected surfaces.
    arm=bpy.data.armatures.new(kind+'-rig');rig=bpy.data.objects.new('Rig',arm);bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
    def bone(name,a,b,parent=None):
        bo=arm.edit_bones.new(name);bo.head=pt(*a);bo.tail=pt(*b)
        if parent:bo.parent=arm.edit_bones[parent]
    hip=510 if g else 480; shoulder=370 if g else 287; elbow=450 if g else 380; wrist=520 if g else 449; knee=652 if g else 604; ankle=797 if g else 788
    bone('torso',(200,hip),(200,shoulder));bone('head',(200,350 if g else 255),(200,210 if g else 130),'torso')
    bone('tail',(200,hip),(230,hip),'torso')
    for side in ['L','R']:
        def xx(x):return 400-x if side=='R' else x
        bone('upper.'+side,(xx(123),shoulder),(xx(100),elbow),'torso')
        bone('lower.'+side,(xx(100),elbow),(xx(84),wrist),'upper.'+side)
        bone('thigh.'+side,(xx(166),hip),(xx(159),knee),'torso')
        bone('shin.'+side,(xx(159),knee),(xx(163),ankle),'thigh.'+side)
        bone('foot.'+side,(xx(163),ankle),(xx(149),floor),'shin.'+side)
    bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)
    def smooth(a,b,t):
        v=max(0,min(1,(t-a)/(b-a)));return v*v*(3-2*v)
    for ob in meshes:
        binding=ob['binding'];mod=ob.modifiers.new('Skin','ARMATURE');mod.object=rig;ob.parent=rig
        if ob.name.startswith('ear'):
            ob.data.materials[0]=skin;ob.data.materials[1]=skin
        groups={b.name:ob.vertex_groups.new(name=b.name) for b in arm.bones}
        for v in ob.data.vertices:
            py=floor-v.co.z/scale
            if binding.startswith('arm.'):
                side=binding[-1]; w=smooth(elbow-23,elbow+23,py)
                anchor=1-smooth(shoulder-2,shoulder+35,py)
                weights={'torso':anchor,'upper.'+side:(1-anchor)*(1-w),'lower.'+side:(1-anchor)*w}
            elif binding.startswith('leg.'):
                side=binding[-1];w=smooth(knee-28,knee+28,py)
                weights={'thigh.'+side:1-w,'shin.'+side:w}
            else:weights={binding:1}
            for name,w in weights.items():
                if w>0:groups[name].add([v.index],w,'REPLACE')
        # Correct all authored winding before export.
        import bmesh
        bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(ob.data);bm.free()
    # Store a native editable source, and a browser-ready binary glTF.
    bpy.ops.wm.save_as_mainfile(filepath=str(BASE/kind/(kind+'-v1.blend')))
    bpy.ops.export_scene.gltf(filepath=str(OUT/(kind+'.glb')),export_format='GLB',export_animations=False,export_yup=True,export_extras=True)
    tris=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)
    return {'kind':kind,'triangles':tris,'meshes':len(meshes),'bones':len(arm.bones),'texture':list(image.size)}

report=[build(k) for k in ['goku','bulma']]
(BASE/'mesh-report.json').write_text(json.dumps(report,indent=2))
print('CHARACTER_REPORT',json.dumps(report))

"""Original parametric vehicles for Blender 4.x. No external models, textures or fonts.
blender --background --python tools/blender/generate_cars.py -- --car silex-c1
blender --background --python tools/blender/generate_cars.py -- --all
"""
import argparse
import json
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
args=argparse.ArgumentParser()
args.add_argument('--car',default='silex-c1')
args.add_argument('--all',action='store_true')
args.add_argument('--no-bake',action='store_true')
args.add_argument('--save-blend',action='store_true')
args.add_argument('--output-dir',type=Path,default=ROOT/'public/models')
args=args.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
OUT=args.output_dir.resolve()
OUT.mkdir(parents=True,exist_ok=True)

def xyz(x,y,z):return (x,-z,y)
def material(name,color,metal=0,rough=.4,emission=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=rough
    bs.inputs['Coat Weight'].default_value=.7 if name.startswith('paint') else .15
    if emission:bs.inputs['Emission Color'].default_value=(*color,1);bs.inputs['Emission Strength'].default_value=emission
    return m

def mesh(name,verts,faces,mat,role=None):
    data=bpy.data.meshes.new(name);data.from_pydata([xyz(*v) for v in verts],[],faces);data.update()
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);data.materials.append(mat);obj['role']=role or name
    for p in data.polygons:p.use_smooth=True
    return obj

def cube(name,pos,scale,mat,bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(*pos));o=bpy.context.object;o.name=name;o.scale=(scale[0],scale[2],scale[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat);o['role']=name
    if bevel:
        mod=o.modifiers.new('soft manufactured edges','BEVEL');mod.width=bevel;mod.segments=2;bpy.ops.object.modifier_apply(modifier=mod.name)
    for p in o.data.polygons:p.use_smooth=True
    return o

def catmull(values,t):
    at=t*(len(values)-1);i=min(len(values)-2,int(at));f=at-i
    a,b,c,d=values[max(0,i-1)],values[i],values[i+1],values[min(len(values)-1,i+2)]
    return .5*((2*b)+(-a+c)*f+(2*a-5*b+4*c-d)*f*f+(-a+3*b-3*c+d)*f*f*f)

def cross(p,angle,wheelbase,wheel_radius=.375):
    # The side is relieved over the wheels; the skin does not cover the tyres.
    z=p['z'];half=p['half_width'];top=p['top'];belt=min(p['belt'],top-.015)
    outline=[(1,0),(.98,.1),(.84,.58),(.74,.93),(.66,1),(.33,1.01),(0,1.01),(-.33,1.01),(-.66,1),(-.74,.93),(-.84,.58),(-.98,.1),(-1,0),(-1,-.25),(-.98,-.65),(-.88,-1),(-.65,-1),(-.32,-1),(0,-1),(.32,-1),(.65,-1),(.88,-1),(.98,-.65),(1,-.25)]
    index=int(round(angle/math.tau*24))%24
    cx,cy=outline[index]
    dist=min(abs(z-wheelbase/2),abs(z+wheelbase/2))
    half*=1+.045*math.exp(-(dist/.4)**2)
    x=half*cx
    if cy>=0:
        # Wide bonnet and deck, narrower cabin with a defined shoulder crease.
        if top<.3:x*=1+(1-abs(cx))*.23
        y=belt+(top-belt)*cy
    else:
        bottom=-.53
        if abs(cx)>.8 and dist<wheel_radius:
            bottom=max(bottom,-.4+math.sqrt(max(0,wheel_radius**2-dist**2)))
        y=belt+(belt-bottom)*cy
    return x,y,z

def make_body(p,mats):
    sections=p['sections'];segments=p['cross_section_segments'];rings=p['longitudinal_segments']
    # Editable Bezier cross-section curves are retained in an optional .blend.
    source=bpy.data.collections.new('source_profiles');bpy.context.scene.collection.children.link(source);source.hide_render=True
    for j,sec in enumerate(sections):
        curve=bpy.data.curves.new(f'section_{j:02d}','CURVE');curve.dimensions='3D';spline=curve.splines.new('BEZIER');spline.bezier_points.add(segments-1);spline.use_cyclic_u=True
        for k,point in enumerate(spline.bezier_points):point.co=xyz(*cross(sec,k/segments*math.tau,p['wheelbase']));point.handle_left_type=point.handle_right_type='AUTO'
        obj=bpy.data.objects.new(f'profile_section_{j:02d}',curve);source.objects.link(obj);obj.hide_render=True;obj.hide_set(True)
    for key in ['side_profile','top_profile']:
        curve=bpy.data.curves.new(key,'CURVE');curve.dimensions='3D';spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(p[key])-1)
        for point,(z,v) in zip(spline.bezier_points,p[key]):point.co=xyz(v*p['width']/2 if key=='top_profile' else 0,v if key=='side_profile' else 0,z*p['length']/2);point.handle_left_type=point.handle_right_type='AUTO'
        obj=bpy.data.objects.new(key,curve);source.objects.link(obj);obj.hide_render=True;obj.hide_set(True)
    verts=[];faces=[];roles=[]
    for j in range(rings+1):
        t=j/rings;sec={key:catmull([v[key] for v in sections],t) for key in ['z','half_width','top','belt']}
        for k in range(segments):verts.append(cross(sec,k/segments*math.tau,p['wheelbase']))
    role_names=['scocca','cofano','tetto','porta_sx','porta_dx','cristallo_ant','cristallo_post','cristallo_sx','cristallo_dx','portellone']
    for j in range(rings):
        z=(verts[j*segments][2]+verts[(j+1)*segments][2])/2;nz=z/(p['length']/2)
        for k in range(segments):
            a=j*segments+k;b=j*segments+(k+1)%segments;c=(j+1)*segments+k;d=(j+1)*segments+(k+1)%segments
            mid=(k+.5)/segments*math.tau;s=math.sin(mid);x=math.cos(mid);role='scocca'
            if s>.65:
                if .34<nz<.91:role='cofano'
                elif .06<nz<.34:role='cristallo_ant'
                elif -.67<nz<-.46:role='cristallo_post'
                elif -.46<=nz<=.06:role='tetto'
                elif nz<-.67:role='portellone'
            elif s>.12 and -.45<nz<.19:role='cristallo_sx' if x<0 else 'cristallo_dx'
            elif -.45<nz<.27 and s<.12 and abs(x)>.65:role='porta_sx' if x<0 else 'porta_dx'
            faces.append((a,b,d,c));roles.append(role_names.index(role))
    faces.append(tuple(reversed(list(range(segments)))));roles.append(0)
    faces.append(tuple(rings*segments+k for k in range(segments)));roles.append(0)
    obj=mesh('body_loft',verts,faces,mats['paint'])
    obj.data.materials.clear()
    for role in role_names:
        base=mats['glass'] if role.startswith('cristallo') else mats['paint']
        mat=base.copy();mat.name='part_'+role;obj.data.materials.append(mat)
    for poly,role in zip(obj.data.polygons,roles):poly.material_index=role
    bpy.context.view_layer.objects.active=obj;obj.select_set(True)
    sub=obj.modifiers.new('light subdivision','SUBSURF');sub.levels=1;bpy.ops.object.modifier_apply(modifier=sub.name)
    dec=obj.modifiers.new('arcade triangle budget','DECIMATE');dec.ratio=.34;dec.use_collapse_triangulate=True;dec.delimit={'MATERIAL'};bpy.ops.object.modifier_apply(modifier=dec.name)
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.separate(type='MATERIAL');bpy.ops.object.mode_set(mode='OBJECT')
    body_parts=list(bpy.context.selected_objects)
    for part in body_parts:
        role=part.data.materials[part.data.polygons[0].material_index].name.removeprefix('part_').split('.')[0];part.name=role;part['role']=role;part['loft']=True
    return body_parts

def wheel(name,center,side,mats):
    parent=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(parent);parent.location=xyz(*center);parent['role']=name
    for role,radius,width,depths in [('gomma',.34,.245,[(.0,.85),(.12,.99),(.24,1.0),(.76,1.0),(.88,.99),(1.0,.85)]),('cerchio',.236,.255,[(0,.84),(.1,1),(.9,1),(1,.84)])]:
        verts=[];faces=[];n=24
        for t,r in depths:
            for j in range(n):
                a=j/n*math.tau;verts.append(((t-.5)*width,math.cos(a)*radius*r,math.sin(a)*radius*r))
        for ring in range(len(depths)-1):
            for j in range(n):a=ring*n+j;b=ring*n+(j+1)%n;faces.append((a,b,b+n,a+n))
        if role=='cerchio':
            for j in range(n):faces.append((j,(j+1)%n,2*n+(j+1)%n,2*n+j))
        obj=mesh(name+'_'+role,verts,faces,mats['rubber'] if role=='gomma' else mats['silver'],role);obj.parent=parent
    for j in range(6):
        angle=j/6*math.tau
        spoke=cube(name+f'_spoke_{j}',(side*.139,math.cos(angle)*.11,math.sin(angle)*.11),(.05,.07,.24),mats['silver'],.015);spoke.rotation_euler.x=angle;spoke.parent=parent;spoke['role']='spoke'
    hub=cube(name+'_hub',(side*.15,0,0),(.04,.09,.09),mats['silver'],.022);hub.parent=parent;hub['role']='hub'
    return parent

def unwrap(objects):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.012);bpy.ops.uv.pack_islands(margin=.008);bpy.ops.object.mode_set(mode='OBJECT')

def bake_ao(objects,p):
    image=bpy.data.images.new(p['id']+'_ao',width=p['ao_size'],height=p['ao_size'],alpha=False);image.colorspace_settings.name='Non-Color'
    for obj in objects:
        for mat in obj.data.materials:
            if not mat:continue
            node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;mat.node_tree.nodes.active=node
    if not args.no_bake:
        bpy.context.scene.render.engine='CYCLES';bpy.context.scene.cycles.samples=p['ao_samples'];bpy.context.scene.render.threads_mode='FIXED';bpy.context.scene.render.threads=4;bpy.context.scene.render.bake.margin=3
        bpy.context.scene.world.color=(.1,.1,.1)
        bpy.context.view_layer.update()
        duplicates=[]
        for original in objects:
            copy=original.copy();copy.data=original.data.copy();copy.parent=None;copy.matrix_world=original.matrix_world.copy();bpy.context.collection.objects.link(copy);duplicates.append(copy);original.hide_render=True
        bpy.ops.object.select_all(action='DESELECT')
        for obj in duplicates:obj.select_set(True)
        bpy.context.view_layer.objects.active=duplicates[0];bpy.ops.object.join();temporary=bpy.context.object
        bpy.ops.object.bake(type='AO',use_clear=True)
        bpy.data.objects.remove(temporary,do_unlink=True)
        for original in objects:original.hide_render=False
    else:image.generated_color=(1,1,1,1)
    import numpy as np
    pixels=np.array(image.pixels[:],dtype=np.float32).reshape(p['ao_size'],p['ao_size'],4)
    gray=pixels[:,:,0]
    gray=sum(np.roll(np.roll(gray,x,axis=1),y,axis=0) for x in [-1,0,1] for y in [-1,0,1])/9
    gray=np.round(gray*63)/63
    pixels[:,:,:3]=gray[:,:,None];pixels[:,:,3]=1
    image.pixels.foreach_set(pixels.ravel())
    ao_dir=ROOT/'artifacts/blender/ao';ao_dir.mkdir(parents=True,exist_ok=True)
    image.filepath_raw=str(ao_dir/(p['id']+'-ao.png'));image.file_format='PNG';image.save();image.pack()
    # The official exporter recognises this occlusion node group.
    for obj in objects:
        for mat in obj.data.materials:
            if not mat:continue
            group=bpy.data.node_groups.get('glTF Material Output')
            if not group:
                group=bpy.data.node_groups.new('glTF Material Output','ShaderNodeTree');group.interface.new_socket(name='Occlusion',in_out='INPUT',socket_type='NodeSocketFloat');group.nodes.new('NodeGroupOutput')
            output=mat.node_tree.nodes.new('ShaderNodeGroup');output.node_tree=group
            tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image;mat.node_tree.links.new(tex.outputs['Color'],output.inputs['Occlusion'])
    return image

def generate(p):
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.materials):bpy.data.materials.remove(block)
    mats={'paint':material('paint',(.24,.32,.39),.62,.24),'glass':material('glass',(.025,.055,.065),.3,.18),'rubber':material('rubber',(.018,.022,.024),0,.83),'silver':material('silver',(.57,.62,.63),.82,.22),'dark':material('dark',(.023,.03,.032),.15,.5),'head':material('headlight',(.7,.83,.75),.2,.22,.8),'tail':material('tail',(.62,.025,.018),.1,.25,1.2),'plate':material('plate',(.68,.7,.56),0,.65)}
    make_body(p,mats)
    if p['family']=='single':
        for obj in list(bpy.context.scene.objects):
            if obj.get('role') in ['tetto','cristallo_ant','cristallo_post','cristallo_sx','cristallo_dx']:bpy.data.objects.remove(obj,do_unlink=True)
    w=p['width'];l=p['length']
    cube('paraurti_ant',(0,-.32,l*.47),(w*.97,.3,.24),mats['paint'],.09)
    cube('paraurti_post',(0,-.32,-l*.47),(w*.97,.3,.23),mats['paint'],.085)
    cube('griglia',(0,-.34,l*.5),(.8,.16,.035),mats['dark'],.025)
    cube('diffusore',(0,-.46,-l*.49),(w*.74,.12,.08),mats['dark'],.035)
    for side in [-1,1]:
        suffix='sx' if side<0 else 'dx'
        cube('minigonna_'+suffix,(side*w*.475,-.44,0),(.12,.16,p['wheelbase']*.74),mats['paint'],.05)
        mirror=cube('specchietto_'+suffix,(side*w*.54,.27,l*.08),(.22,.13,.28),mats['paint'],.055)
        cube('specchio_'+suffix,(side*w*.55,.28,l*.045),(.17,.095,.012),mats['silver'],.018)
        cube('faro_'+suffix,(side*w*.30,-.115,l*.493),(w*.25,.105,.045),mats['head'],.025)
        cube('fanale_'+suffix,(side*w*.30,.02,-l*.508),(w*.25,.13,.1),mats['tail'],.045)
        for j in range(3):cube('tail_rib_'+suffix+str(j),(side*w*.30+(j-1)*.12,.02,-l*.522),(.018,.12,.012),mats['dark'],.004)
        cube('spoiler_mount_'+suffix,(side*w*.3,.18,-l*.4),(.07,.19,.09),mats['dark'],.018)
        cube('scarico_'+suffix,(side*w*.33,-.46,-l*.515),(.15,.12,.25),mats['silver'],.055)
        cube('scarico_interno_'+suffix,(side*w*.33,-.46,-l*.546),(.11,.08,.01),mats['dark'],.035)
        cube('maniglia_'+suffix,(side*w*.487,.06,-l*.13),(.02,.025,.16),mats['dark'],.01)
        wheel('ruota_ant_'+suffix,(side*p['track']/2,-.4,p['wheelbase']/2),side,mats)
        wheel('ruota_post_'+suffix,(side*p['track']/2,-.4,-p['wheelbase']/2),side,mats)
    cube('spoiler',(0,.3,-l*.41),(w*.86,.075,.22),mats['paint'],.035)
    cube('targa',(0,-.19,-l*.505),(.48,.16,.015),mats['plate'],.01)
    cube('stemma',(0,.1,-l*.495),(.09,.055,.02),mats['silver'],.02)
    # Interior silhouettes, engine cover and baggage audio are genuine geometry.
    cube('interni',(0,-.05,-l*.05),(w*.69,.2,l*.37),mats['dark'],.08)
    for side in [-1,1]:cube('sedile_'+str(side),(side*w*.21,.1,-l*.06),(.38,.4,.31),mats['dark'],.07)
    cube('motore',(0,-.06,l*.27),(w*.53,.25,.7),mats['dark'],.04)
    for j in range(4):cube('collettore_'+str(j),((j-1.5)*.13,.08,l*.27),(.09,.08,.5),mats['silver'],.025)
    cube('audio_bagagliaio',(0,-.05,-l*.35),(w*.55,.19,.36),mats['dark'],.03)
    objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
    triangles=sum(sum(len(face.vertices)-2 for face in obj.data.polygons) for obj in objects)
    target=p['target_triangles']
    if triangles>target:
        ratio=max(.2,(target-1000)/(triangles-1000))
        for obj in objects:
            if len(obj.data.polygons)>20 and not obj.get('loft',False):
                bpy.context.view_layer.objects.active=obj;mod=obj.modifiers.new('final triangle budget','DECIMATE');mod.ratio=ratio;mod.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=mod.name)
    # Broad manufactured faces retain straight reflections after bevel/decimation.
    # Loft panels already share continuous surface normals and must keep them.
    for obj in objects:
        if obj.get('loft',False):continue
        bpy.context.view_layer.objects.active=obj
        normal=obj.modifiers.new('manufactured face normals','WEIGHTED_NORMAL')
        normal.keep_sharp=True;normal.weight=50
        bpy.ops.object.modifier_apply(modifier=normal.name)
    unwrap(objects);bake_ao(objects,p)
    triangles=sum(sum(len(face.vertices)-2 for face in obj.data.polygons) for obj in objects)
    if not 3000<=triangles<=8000:raise RuntimeError(f"{p['id']}: {triangles} triangles outside the 3000-8000 budget")
    # Source curves are never exported as meshes.
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.context.scene.objects:
        if obj.type in ('MESH','EMPTY'):obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(OUT/(p['id']+'.glb')),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True,export_texcoords=True,export_normals=True,export_materials='EXPORT',export_cameras=False,export_lights=False)
    if args.save_blend:
        blend_dir=ROOT/'artifacts/blender';blend_dir.mkdir(parents=True,exist_ok=True);bpy.ops.wm.save_as_mainfile(filepath=str(blend_dir/(p['id']+'.blend')))
    return {'id':p['id'],'file':p['id']+'.glb','triangles':triangles,'ao_size':p['ao_size'],'parts':[o.name for o in objects]}

files=sorted((ROOT/'tools/blender/cars').glob('*.json')) if args.all else [ROOT/'tools/blender/cars'/f'{args.car}.json']
manifest=[]
for file in files:
    bpy.data.orphans_purge(do_recursive=True)
    p=json.loads(file.read_text(encoding='utf-8'));print('GENERATING',p['id'],flush=True);manifest.append(generate(p));print('COMPLETE',p['id'],manifest[-1]['triangles'],flush=True)
previous=OUT/'manifest.json'
if previous.exists() and not args.all:
    other=[m for m in json.loads(previous.read_text())['cars'] if m['id']!=args.car];manifest=other+manifest
previous.write_text(json.dumps({'generator':'tools/blender/generate_cars.py','blender':bpy.app.version_string,'version':2,'cars':manifest},indent=2)+'\n')
print('ALL MODELS COMPLETE',len(manifest),flush=True)
